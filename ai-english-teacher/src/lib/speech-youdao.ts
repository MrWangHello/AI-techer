/**
 * 有道 TTS：通过 dict.youdao.com/dictvoice 获取 MP3 并用 <audio> 播放。
 *
 * 轻量级，无需下载模型，手机 QQ/荣耀等浏览器网络可用就能播。
 * 失败时自动降级到本地 Piper（speech-local-tts）。
 *
 * 注：有道 API 无 CORS 头，所以用 <audio> 元素而不用 fetch + AudioContext。
 *    <audio> 可以播放跨域音频，不受 CORS 限制。
 *
 * 有道是词典发音接口，单词/短句成功率很高，长句子可能失败属正常。
 */

import { detectSpeakLang } from "./speak-lang";
import { speakLocal, stopLocalTts } from "./speech-local-tts";

let currentAudio: HTMLAudioElement | null = null;

export function stopYoudao(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio.load();
    currentAudio = null;
  }
}

/**
 * 用 <audio> 播放有道 MP3。
 * 返回 true 表示播放成功，false 表示失败（需要调用方降级）。
 */
async function youdaoPlay(text: string, speed?: number): Promise<boolean> {
  const lang = detectSpeakLang(text);
  // type=1 英式发音, type=2 美式发音；中文自动识别
  const type = lang === "en" ? 2 : 1;
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;

  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.playbackRate = speed ?? 1;

    // 播放成功
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve(true);
    };
    // 播放失败
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve(false);
    };

    stopYoudao();
    currentAudio = audio;

    audio.play().catch(() => {
      currentAudio = null;
      resolve(false);
    });
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
      const ok = await youdaoPlay(text, speed);
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