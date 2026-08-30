/**
 * 本地嘴巴：Piper 华研女声 x_low（约 20MB）跟网页放在一起。
 * 荣耀 / 微信没有 speechSynthesis 时，用 Web Audio 播 PCM。
 */

import { encodeIpa, splitSpeakChunks, textToIpa } from "./tts-phonemes";

export type LocalTtsStatus = "idle" | "downloading" | "ready" | "error";

const READY_KEY = "bella_local_tts_ready";
const ONNX_NAME = "zh_CN-huayan-x_low.onnx";
const CONFIG_NAME = "zh_CN-huayan-x_low.onnx.json";
const TABLE_NAME = "pinyin-ipa.json";

type OrtModule = {
  InferenceSession: {
    create: (source: Uint8Array | ArrayBuffer | string, options?: Record<string, unknown>) => Promise<OrtSession>;
  };
  Tensor: new (type: string, data: Float32Array | BigInt64Array, dims: number[]) => unknown;
  env?: { wasm?: { wasmPaths?: string } };
};

type OrtSession = {
  run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: Float32Array | number[] }>>;
};

type PiperConfig = {
  audio?: { sample_rate?: number };
  inference?: { noise_scale?: number; length_scale?: number; noise_w?: number };
  phoneme_id_map: Record<string, number[]>;
};

let session: OrtSession | null = null;
let TensorCtor: OrtModule["Tensor"] | null = null;
let config: PiperConfig | null = null;
let table: Record<string, string> | null = null;
let loadPromise: Promise<void> | null = null;
let status: LocalTtsStatus = "idle";
let lastError = "";
let progress = 0;
const listeners = new Set<(s: { status: LocalTtsStatus; progress: number; error: string }) => void>();

let currentSource: { stop: () => void } | null = null;

function emit(): void {
  const snap = { status, progress, error: lastError };
  listeners.forEach((fn) => fn(snap));
}

export function resolveTtsDir(): string {
  if (typeof window === "undefined") {
    return `${process.cwd()}/public/models/tts-zh-huayan-x_low/`;
  }
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}/models/tts-zh-huayan-x_low/`;
}

export function subscribeLocalTts(fn: (s: { status: LocalTtsStatus; progress: number; error: string }) => void): () => void {
  listeners.add(fn);
  fn({ status, progress, error: lastError });
  return () => listeners.delete(fn);
}

export function getLocalTtsSnapshot(): { status: LocalTtsStatus; progress: number; error: string; ready: boolean } {
  return { status, progress, error: lastError, ready: status === "ready" || isLocalTtsMarkedReady() };
}

export function isLocalTtsMarkedReady(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(READY_KEY) === "1";
}

export function isLocalTtsReady(): boolean {
  return !!session || status === "ready";
}

export function friendlyTtsError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed|abort|timeout|network/i.test(msg)) {
    return "嘴巴包装不上，请检查网络后再试";
  }
  return msg.slice(0, 80) || "离线播报包装不上";
}

async function loadOrt(): Promise<OrtModule> {
  if (typeof window === "undefined") {
    const nodeRuntime = "onnxruntime-node";
    return (await import(nodeRuntime)) as unknown as OrtModule;
  }
  const ort = (await import("onnxruntime-web")) as unknown as OrtModule;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (ort.env?.wasm) {
    ort.env.wasm.wasmPaths = `${base}/ort/`;
  }
  return ort;
}

async function fetchWithProgress(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`嘴巴包 HTTP ${res.status}`);
  const total = Number(res.headers.get("content-length") || 0);
  if (!res.body || !total) return res.arrayBuffer();

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      progress = Math.max(1, Math.min(99, Math.round((received / total) * 100)));
      emit();
    }
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out.buffer;
}

async function loadSitePack(): Promise<void> {
  const dir = resolveTtsDir();
  const ort = await loadOrt();
  TensorCtor = ort.Tensor;

  if (typeof window === "undefined") {
    const { readFileSync } = await import("node:fs");
    config = JSON.parse(readFileSync(`${dir}${CONFIG_NAME}`, "utf8")) as PiperConfig;
    table = JSON.parse(readFileSync(`${dir}${TABLE_NAME}`, "utf8")) as Record<string, string>;
    const onnx = readFileSync(`${dir}${ONNX_NAME}`);
    progress = 80;
    emit();
    session = await ort.InferenceSession.create(new Uint8Array(onnx));
    return;
  }

  progress = 2;
  emit();
  const [cfgRes, tableRes] = await Promise.all([fetch(`${dir}${CONFIG_NAME}`), fetch(`${dir}${TABLE_NAME}`)]);
  if (!cfgRes.ok || !tableRes.ok) throw new Error("嘴巴包配置读取失败");
  config = (await cfgRes.json()) as PiperConfig;
  table = (await tableRes.json()) as Record<string, string>;
  progress = 8;
  emit();
  const onnx = await fetchWithProgress(`${dir}${ONNX_NAME}`);
  session = await ort.InferenceSession.create(new Uint8Array(onnx));
}

export async function ensureLocalTts(): Promise<boolean> {
  if (session && config && table) {
    status = "ready";
    emit();
    return true;
  }
  if (loadPromise) {
    await loadPromise;
    return !!session;
  }

  loadPromise = (async () => {
    status = "downloading";
    progress = 1;
    lastError = "";
    emit();
    try {
      await loadSitePack();
      status = "ready";
      progress = 100;
      if (typeof window !== "undefined") window.localStorage.setItem(READY_KEY, "1");
      emit();
    } catch (err) {
      status = "error";
      lastError = friendlyTtsError(err);
      session = null;
      config = null;
      table = null;
      loadPromise = null;
      emit();
    }
  })();

  await loadPromise;
  return !!session;
}

export async function synthesizeLocalAsync(text: string, speed = 1): Promise<{ audio: Float32Array; sampleRate: number }> {
  const ok = await ensureLocalTts();
  if (!ok || !session || !config || !table || !TensorCtor) {
    throw new Error(lastError || "离线播报还没准备好");
  }

  const sampleRate = config.audio?.sample_rate || 16000;
  const chunks = splitSpeakChunks(text);
  const pieces: Float32Array[] = [];
  for (const chunk of chunks) {
    const ipa = textToIpa(chunk, table);
    const ids = encodeIpa(ipa, config.phoneme_id_map);
    if (ids.length < 3) continue;
    const lengthScale = Math.max(0.55, Math.min(2, (config.inference?.length_scale ?? 1) / (speed || 1)));
    const noise = config.inference?.noise_scale ?? 0.667;
    const noiseW = config.inference?.noise_w ?? 0.8;
    const input = BigInt64Array.from(ids.map(BigInt));
    const out = await session.run({
      input: new TensorCtor("int64", input, [1, ids.length]),
      input_lengths: new TensorCtor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new TensorCtor("float32", Float32Array.from([noise, lengthScale, noiseW]), [3]),
    });
    const raw = out.output?.data;
    if (!raw) continue;
    pieces.push(raw instanceof Float32Array ? raw : Float32Array.from(raw));
  }

  if (pieces.length === 0) return { audio: new Float32Array(0), sampleRate };
  if (pieces.length === 1) return { audio: pieces[0], sampleRate };
  const gap = Math.round(sampleRate * 0.12);
  let total = pieces.reduce((n, p) => n + p.length, 0) + gap * (pieces.length - 1);
  const audio = new Float32Array(total);
  let offset = 0;
  for (let i = 0; i < pieces.length; i += 1) {
    audio.set(pieces[i], offset);
    offset += pieces[i].length + (i < pieces.length - 1 ? gap : 0);
  }
  return { audio, sampleRate };
}

function playPcm(audio: Float32Array, sampleRate: number): Promise<void> {
  if (typeof window === "undefined" || audio.length === 0) return Promise.resolve();
  stopLocalTts();
  const ctx = new AudioContext();
  const buffer = ctx.createBuffer(1, audio.length, sampleRate);
  buffer.getChannelData(0).set(audio);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  const handle = {
    stop: () => {
      try {
        src.stop();
      } catch (_) {}
      void ctx.close();
    },
  };
  currentSource = handle;
  return new Promise((resolve) => {
    src.onended = () => {
      if (currentSource === handle) currentSource = null;
      void ctx.close();
      resolve();
    };
    void ctx.resume();
    src.start();
  });
}

export function stopLocalTts(): void {
  currentSource?.stop();
  currentSource = null;
}

export async function speakLocal(
  text: string,
  opts: { speed?: number; onEnd?: () => void } = {}
): Promise<boolean> {
  try {
    const { audio, sampleRate } = await synthesizeLocalAsync(text, opts.speed ?? 1);
    if (audio.length < 200) {
      opts.onEnd?.();
      return false;
    }
    await playPcm(audio, sampleRate);
    opts.onEnd?.();
    return true;
  } catch (err) {
    console.warn("[Speech] local TTS failed:", err);
    opts.onEnd?.();
    return false;
  }
}

/** 测试用：去掉未使用的同步壳，避免误调用 */
export function audioEnergy(samples: Float32Array): { rms: number; peak: number; seconds: number } {
  let sum = 0;
  let peak = 0;
  for (const x of samples) {
    sum += x * x;
    peak = Math.max(peak, Math.abs(x));
  }
  return {
    rms: samples.length ? Math.sqrt(sum / samples.length) : 0,
    peak,
    seconds: samples.length / 16000,
  };
}
