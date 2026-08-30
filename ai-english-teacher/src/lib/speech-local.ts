/**
 * 浏览器本地识别：首次需要时下载离线包，之后走缓存。
 * 国内优先走 hf-mirror，连不上再试 huggingface.co。
 * 当前可运行包是 Whisper tiny（中文短句）。
 */

export type LocalSttStatus = "idle" | "downloading" | "ready" | "error";

const MODEL_ID = "Xenova/whisper-tiny";
const READY_KEY = "bella_local_stt_ready";

export const MODEL_HOSTS = ["https://hf-mirror.com/", "https://huggingface.co/"] as const;

type AsrPipe = (audio: Float32Array, opts?: Record<string, unknown>) => Promise<{ text?: string }>;

let pipe: AsrPipe | null = null;
let loadPromise: Promise<void> | null = null;
let status: LocalSttStatus = "idle";
let lastError = "";
let progress = 0;
const listeners = new Set<(s: { status: LocalSttStatus; progress: number; error: string }) => void>();

function emit(): void {
  const snap = { status, progress, error: lastError };
  listeners.forEach((fn) => fn(snap));
}

export function subscribeLocalStt(fn: (s: { status: LocalSttStatus; progress: number; error: string }) => void): () => void {
  listeners.add(fn);
  fn({ status, progress, error: lastError });
  return () => listeners.delete(fn);
}

export function getLocalSttSnapshot(): { status: LocalSttStatus; progress: number; error: string; ready: boolean } {
  return { status, progress, error: lastError, ready: status === "ready" || isLocalMarkedReady() };
}

export function isLocalMarkedReady(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(READY_KEY) === "1";
}

export function isLocalSttReady(): boolean {
  return !!pipe || status === "ready";
}

/** transformers 进度是 0–100；少数回调会给 0–1 的小数（1 本身按 1% 算） */
export function displayPackProgress(raw: number): number {
  if (!Number.isFinite(raw) || raw < 0) return 1;
  const pct = raw > 0 && raw < 1 ? raw * 100 : raw;
  return Math.max(1, Math.min(99, Math.round(pct)));
}

export function friendlyPackError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed|abort|timeout|network/i.test(msg)) {
    return "模型站连不上，可换网络或改用浏览器识别";
  }
  return msg.slice(0, 80) || "离线语音包装不上";
}

export async function pickReachableHost(fetchImpl: typeof fetch = fetch): Promise<string> {
  for (const host of MODEL_HOSTS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetchImpl(`${host}${MODEL_ID}/resolve/main/config.json`, {
        method: "GET",
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (res.ok) return host;
    } catch {
      // try next
    } finally {
      clearTimeout(timer);
    }
  }
  return MODEL_HOSTS[0];
}

async function loadPipelineFromHost(host: string): Promise<AsrPipe> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowRemoteModels = true;
  env.remoteHost = host;
  const created = await pipeline("automatic-speech-recognition", MODEL_ID, {
    progress_callback: (info: { status?: string; progress?: number }) => {
      if (typeof info.progress === "number") {
        progress = displayPackProgress(info.progress);
        emit();
      }
    },
  });
  return created as unknown as AsrPipe;
}

export async function ensureLocalModel(): Promise<boolean> {
  if (pipe) {
    status = "ready";
    emit();
    return true;
  }
  if (loadPromise) {
    await loadPromise;
    return !!pipe;
  }

  loadPromise = (async () => {
    status = "downloading";
    progress = 1;
    lastError = "";
    emit();
    try {
      const host = await pickReachableHost();
      pipe = await loadPipelineFromHost(host);
      status = "ready";
      progress = 100;
      if (typeof window !== "undefined") window.localStorage.setItem(READY_KEY, "1");
      emit();
    } catch (err) {
      status = "error";
      lastError = friendlyPackError(err);
      pipe = null;
      loadPromise = null;
      emit();
    }
  })();

  await loadPromise;
  return !!pipe;
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let n = 0;
    for (let j = start; j < end; j++) {
      sum += input[j];
      n += 1;
    }
    out[i] = n ? sum / n : input[start] ?? 0;
  }
  return out;
}

export async function transcribeBlob(blob: Blob): Promise<string> {
  const ok = await ensureLocalModel();
  if (!ok || !pipe) throw new Error(lastError || "离线识别还没准备好");

  const buffer = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(buffer.slice(0));
  await ctx.close();
  const raw = decoded.getChannelData(0);
  const samples = downsample(raw, decoded.sampleRate, 16000);
  const result = await pipe(samples, { language: "chinese", task: "transcribe" });
  return (result.text || "").trim();
}

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let chunks: BlobPart[] = [];

export async function startLocalRecording(): Promise<void> {
  stopLocalRecording();
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(mediaStream);
  chunks = [];
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  rec.start();
  mediaRecorder = rec;
}

export function stopLocalRecording(): void {
  try {
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  } catch (_) {}
  mediaRecorder = null;
  mediaStream?.getTracks().forEach((t) => t.stop());
  mediaStream = null;
}

export async function finishLocalRecording(): Promise<string> {
  const rec = mediaRecorder;
  const stream = mediaStream;
  if (!rec) return "";

  const blob = await new Promise<Blob>((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    rec.onerror = () => reject(new Error("录音失败"));
    if (rec.state !== "inactive") rec.stop();
    else resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
  });
  stream?.getTracks().forEach((t) => t.stop());
  mediaRecorder = null;
  mediaStream = null;
  chunks = [];
  if (blob.size < 800) return "";
  return transcribeBlob(blob);
}
