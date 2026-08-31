/**
 * 有道 TTS：通过 dict.youdao.com/dictvoice 获取 MP3 并用 Web Audio 播放。
 *
 * 轻量级，无需下载模型，手机 QQ/荣耀等浏览器网络可用就能播。
 * 失败时自动降级到本地 Piper（speech-local-tts）。
 *
 * 有道是词典发音接口，单词/短句成功率很高，长句子可能失败属正常。
 */

import { detectSpeakLang } from "./speak-lang";
import { speakLocal, stopLocalTts } from "./speech-local-tts";

let currentSource: { stop: () => void } | null = null;

export function stopYoudao(): void {
  currentSource?.stop();
  currentSource = null;
}

/**
 * 获取有道 MP3 并用 AudioContext 播放。
 * 返回 true 表示播放成功，false 表示失败（需要调用方降级）。
 */
async function youdaoFetchAndPlay(text: string, speed?: number): Promise<boolean> {
  const lang = detectSpeakLang(text);
  // type=1 英式发音, type=2 美式发音；中文自动识别
  const type = lang === "en" ? 2 : 1;
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;

  const res = await fetch(url);
  if (!res.ok) return false;

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength < 100) return false;

  // 停止之前的播放
  stopYoudao();

  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = speed ?? 1;
  source.connect(ctx.destination);

  const handle = {
    stop: () => {
      try {
        source.stop();
      } catch (_) {}
      void ctx.close();
    },
  };
  currentSource = handle;

  return new Promise((resolve) => {
    source.onended = () => {
      if (currentSource === handle) currentSource = null;
      void ctx.close();
      resolve(true);
    };
    void ctx.resume();
    source.start();
  });
}

/**
 * 用有道 TTS 朗读文本。
 * 先试有道（MP3 轻量），失败后自动降级到本地 Piper。
 *
 * 调用方式与 speakWithLocal 一致：fire-and-forget，返回 boolean。
 */
export function speakWithYoudao(
  text: string,
  onEnd?: () => void,
  speed?: number,
): boolean {
  if (!text.trim()) {
    onEnd?.();
    return false;
  }

  stopYoudao();

  void (async () => {
    try {
      const ok = await youdaoFetchAndPlay(text, speed);
      if (ok) {
        onEnd?.();
        return;
      }
    } catch (_) {
      // 网络异常等，走降级
    }

    // 有道失败 → 降级到本地 Piper
    stopLocalTts();
    await speakLocal(text, { speed, onEnd });
  })();

  return true;
}