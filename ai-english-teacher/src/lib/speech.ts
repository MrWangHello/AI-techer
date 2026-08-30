/**
 * 语音工具模块 - 基于 Web Speech API
 *
 * TTS：浏览器原生 SpeechSynthesis（Chrome wake-up 修复）
 * STT：浏览器原生 SpeechRecognition / webkitSpeechRecognition
 */

let recognition: any = null;
let isListening = false;
let voicesLoaded = false;
let voicesPromise: Promise<void> | null = null;
/** 是否已完成首次 TTS 预热（避免 STT 期间预热与回复抢音频） */
let ttsPrimed = false;
/** 按语言缓存选定的音色，避免每次 speak 随机切换 */
const cachedVoiceByLang: Record<string, SpeechSynthesisVoice | undefined> = {};

type SpeakingStateCallback = (speaking: boolean) => void;
let onSpeakingStateChange: SpeakingStateCallback | null = null;

export function setSpeakingStateCallback(cb: SpeakingStateCallback): void {
  onSpeakingStateChange = cb;
}

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis;
}

function loadVoices(): Promise<void> {
  if (voicesLoaded) return Promise.resolve();
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const synth = getSynth();
    if (!synth) {
      voicesLoaded = true;
      resolve();
      return;
    }

    const voices = synth.getVoices();
    if (voices.length > 0) {
      voicesLoaded = true;
      cachePreferredVoices();
      resolve();
      return;
    }

    synth.onvoiceschanged = () => {
      voicesLoaded = true;
      cachePreferredVoices();
      resolve();
    };

    setTimeout(() => {
      if (!voicesLoaded) {
        voicesLoaded = true;
        resolve();
      }
    }, 5000);
  });

  return voicesPromise;
}

function pickVoiceForLang(lang: string): SpeechSynthesisVoice | undefined {
  if (cachedVoiceByLang[lang]) return cachedVoiceByLang[lang];

  const synth = getSynth();
  if (!synth) return undefined;

  const voices = synth.getVoices();
  const langPrefix = lang.split("-")[0];
  const matched =
    voices.find(
      (v) =>
        v.lang.startsWith(langPrefix) &&
        /xiaoxiao|xiaoyi|xiaoyan|yaoyao|huihui|female|女|samantha|google.*zh|google.*cn/i.test(
          v.name
        )
    ) ||
    voices.find((v) => v.lang.startsWith(langPrefix) && /google|microsoft/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith(langPrefix));

  if (matched) cachedVoiceByLang[lang] = matched;
  return matched;
}

/** 预热时锁定中/英音色，避免后续 speak 音色漂移 */
function cachePreferredVoices(): void {
  pickVoiceForLang("zh-CN");
  pickVoiceForLang("en-US");
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  const synth = getSynth();
  if (!synth) return [];
  try {
    return synth.getVoices();
  } catch {
    return [];
  }
}

export function isSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.speechSynthesis;
}

export function isSpeechUsable(): boolean {
  if (typeof window === "undefined") return false;
  const synth = window.speechSynthesis;
  if (!synth) return false;
  try {
    const voices = synth.getVoices();
    return voices.length > 0 || typeof synth.speak === "function";
  } catch {
    return false;
  }
}

function createUtterance(
  text: string,
  lang: string,
  rate: number,
  pitch: number,
  onEnd: () => void
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;

  try {
    const synth = getSynth();
    if (synth) {
      const matched = pickVoiceForLang(lang);
      if (matched) utterance.voice = matched;
    }
  } catch (_) {}

  utterance.onend = () => {
    onEnd();
  };

  utterance.onerror = (e) => {
    if (e.error === "canceled" || e.error === "interrupted") return;
    console.warn(`[Speech] Error: ${e.error} for "${text.substring(0, 30)}"`);
    onEnd();
  };

  return utterance;
}

function doSpeak(utterance: SpeechSynthesisUtterance): boolean {
  const synth = getSynth();
  if (!synth) return false;

  try {
    loadVoices().then(() => cachePreferredVoices());

    if (synth.paused) {
      synth.resume();
    }

    const startMain = () => {
      try {
        synth.cancel();
        synth.speak(utterance);
        ttsPrimed = true;
      } catch (e) {
        console.warn("[Speech] startMain failed:", e);
      }
    };

    // 已预热且空闲：直接播，不再插入 silent utterance（减少被 cancel 打断）
    if (ttsPrimed && !synth.speaking && !synth.pending) {
      startMain();
      return true;
    }

    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const wakeUp = new SpeechSynthesisUtterance("\u200b");
    wakeUp.volume = 0.01;
    wakeUp.rate = 10;
    wakeUp.onend = startMain;
    wakeUp.onerror = startMain;
    synth.speak(wakeUp);

    return true;
  } catch (e) {
    console.warn("[Speech] doSpeak failed:", e);
    return false;
  }
}

export function speak(text: string, onEnd?: () => void, speed?: number): boolean {
  if (!text.trim()) {
    onSpeakingStateChange?.(false);
    onEnd?.();
    return false;
  }

  const synth = getSynth();
  if (!synth) {
    console.warn("[Speech] SpeechSynthesis not available");
    onSpeakingStateChange?.(false);
    return false;
  }

  try {
    cachePreferredVoices();
    onSpeakingStateChange?.(true);

    const utterance = createUtterance(
      text,
      "zh-CN",
      speed ?? 1.0,
      1.1,
      () => {
        onSpeakingStateChange?.(false);
        onEnd?.();
      }
    );

    const success = doSpeak(utterance);
    if (!success) {
      onSpeakingStateChange?.(false);
    }
    return success;
  } catch (e) {
    console.warn("[Speech] speak failed:", e);
    onSpeakingStateChange?.(false);
    return false;
  }
}

export function speakEnglish(text: string, onEnd?: () => void, speed?: number): boolean {
  if (!text.trim()) {
    onSpeakingStateChange?.(false);
    onEnd?.();
    return false;
  }

  const synth = getSynth();
  if (!synth) {
    console.warn("[Speech] SpeechSynthesis not available");
    onSpeakingStateChange?.(false);
    return false;
  }

  try {
    cachePreferredVoices();
    onSpeakingStateChange?.(true);

    const utterance = createUtterance(
      text,
      "en-US",
      speed ?? 0.9,
      1.0,
      () => {
        onSpeakingStateChange?.(false);
        onEnd?.();
      }
    );

    const success = doSpeak(utterance);
    if (!success) {
      onSpeakingStateChange?.(false);
    }
    return success;
  } catch (e) {
    console.warn("[Speech] speakEnglish failed:", e);
    onSpeakingStateChange?.(false);
    return false;
  }
}

export function warmUpSpeech(): boolean {
  if (ttsPrimed) return true;
  const synth = getSynth();
  if (!synth) return false;

  try {
    loadVoices().then(() => cachePreferredVoices());

    if (synth.paused) {
      synth.resume();
    }

    if (synth.speaking || synth.pending) return true;

    const wakeUp = new SpeechSynthesisUtterance("\u200b");
    wakeUp.volume = 0.01;
    wakeUp.rate = 10;
    wakeUp.onend = () => {
      ttsPrimed = true;
    };
    wakeUp.onerror = () => {
      ttsPrimed = true;
    };
    synth.speak(wakeUp);

    return true;
  } catch (e) {
    console.warn("[Speech] warmUp failed:", e);
    return false;
  }
}

/** STT 结束后稍等再 TTS，避免麦克风与扬声器抢资源（首次点击中断的主因） */
export async function speakAfterMic(
  text: string,
  onEnd?: () => void,
  speed?: number
): Promise<boolean> {
  stopListening();
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 180));
  return speak(text, onEnd, speed);
}

export function stopSpeaking(): void {
  const synth = getSynth();
  if (synth) {
    synth.cancel();
    onSpeakingStateChange?.(false);
  }
}

export const cancelSpeech = stopSpeaking;

export function startListening(
  onResult: (text: string) => void,
  onError?: (error: string) => void
): void {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.("您的浏览器不支持语音识别");
    return;
  }

  if (isListening) return;

  // 开麦前停 TTS，避免与 STT 争用音频（尤其页面首次点击）
  stopSpeaking();

  try {
    recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      isListening = false;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      isListening = false;
      const errorMap: Record<string, string> = {
        "no-speech": "没有检测到语音",
        aborted: "语音识别被中断",
        "audio-capture": "无法访问麦克风",
        network: "网络错误",
        "not-allowed": "麦克风权限被拒绝",
        "service-not-allowed": "语音识别服务不可用",
        "bad-grammar": "语法错误",
        "language-not-supported": "不支持的语言",
      };
      onError?.(errorMap[event.error] || event.error || "语音识别出错");
    };

    recognition.onend = () => {
      isListening = false;
    };

    recognition.start();
    isListening = true;
  } catch (e) {
    isListening = false;
    onError?.("语音识别启动失败");
  }
}

export function stopListening(): void {
  if (recognition && isListening) {
    try {
      recognition.stop();
    } catch (_) {}
  }
  isListening = false;
}

export function getIsListening(): boolean {
  return isListening;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

export function isSTTSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
}
