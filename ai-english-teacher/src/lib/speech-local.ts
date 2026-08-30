/**
 * 浏览器本地识别：首次需要时下载离线包，之后走缓存。
 * 当前可运行包是 Whisper tiny（中文短句）。探测/下载管道与 SenseVoice 相同，换模型只改 MODEL_ID。
 */

export type LocalSttStatus = "idle" | "downloading" | "ready" | "error";

const MODEL_ID = "Xenova/whisper-tiny";
const READY_KEY = "bella_local_stt_ready";

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
      const { pipeline } = await import("@huggingface/transformers");
      const created = await pipeline("automatic-speech-recognition", MODEL_ID, {
        progress_callback: (info: { status?: string; progress?: number }) => {
          if (typeof info.progress === "number") {
            progress = Math.max(1, Math.min(99, Math.round(info.progress)));
            emit();
          }
        },
      });
      pipe = created as unknown as AsrPipe;
      status = "ready";
      progress = 100;
      if (typeof window !== "undefined") window.localStorage.setItem(READY_KEY, "1");
      emit();
    } catch (err) {
      status = "error";
      lastError = err instanceof Error ? err.message : "离线语音包装不上";
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
