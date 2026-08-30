/**
 * 语音工具模块 - 基于 Web Speech API
 *
 * TTS：浏览器原生 SpeechSynthesis（Chrome wake-up 修复）
 * STT：浏览器原生 SpeechRecognition / webkitSpeechRecognition
 */

let recognition: any = null;
let isListening = false;
/** 主动 stop() 触发的 aborted，不应报错给用户 */
let intentionalStop = false;
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
  await new Promise((r) => setTimeout(r, 280));
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
  onError?: (error: string) => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.("您的浏览器不支持语音识别");
    return;
  }

  if (isListening) {
    stopListening();
  }

  // 开麦前停 TTS，避免与 STT 争用音频（尤其页面首次点击）
  stopSpeaking();
  intentionalStop = false;

  try {
    recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const current = recognition;
    let tapRetry = 0;
    let lastTranscript = "";
    let resultDelivered = false;

    recognition.onresult = (event: any) => {
      if (current !== recognition) return;
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) final += piece;
        else interim += piece;
      }
      lastTranscript = (final || interim).trim();
      if (final.trim() && !resultDelivered) {
        resultDelivered = true;
        isListening = false;
        onResult(final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (current !== recognition) return;
      if (intentionalStop && (event.error === "aborted" || event.error === "no-speech")) {
        intentionalStop = false;
        return;
      }
      if (event.error === "network" && tapRetry < 1) {
        tapRetry += 1;
        try {
          recognition.start();
          return;
        } catch (_) {}
      }
      isListening = false;
      intentionalStop = false;
      const errorMap: Record<string, string> = {
        "no-speech": "没有检测到语音，请再试一次",
        aborted: "语音识别被中断，请再点一次",
        "audio-capture": "无法访问麦克风",
        network: "网络不稳定，请检查网络后重试",
        "not-allowed": "麦克风权限被拒绝",
        "service-not-allowed": "语音识别服务不可用",
        "bad-grammar": "语法错误",
        "language-not-supported": "不支持的语言",
      };
      onError?.(errorMap[event.error] || event.error || "语音识别出错");
    };

    recognition.onend = () => {
      if (current !== recognition) return;
      isListening = false;
      intentionalStop = false;
      if (resultDelivered) {
        onEnd?.();
        return;
      }
      if (lastTranscript.trim()) {
        resultDelivered = true;
        onResult(lastTranscript.trim());
      } else {
        onError?.("没有检测到语音，请再试一次");
      }
      onEnd?.();
    };

    recognition.start();
    isListening = true;
  } catch (e) {
    isListening = false;
    onError?.("语音识别启动失败");
  }
}

export function stopListening(): void {
  intentionalStop = true;
  clearHoldEndTimer();
  holdEndResolve = null;
  holdEndReject = null;
  holdAccumulated = "";
  holdLastInterim = "";
  if (recognition) {
    try {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    } catch (_) {}
    recognition = null;
  }
  isListening = false;
}

export function getIsListening(): boolean {
  return isListening;
}

let holdAccumulated = "";
let holdLastInterim = "";
let holdEndResolve: ((text: string) => void) | null = null;
let holdEndReject: (() => void) | null = null;
let holdEndTimer: ReturnType<typeof setTimeout> | null = null;

function clearHoldEndTimer(): void {
  if (holdEndTimer) {
    clearTimeout(holdEndTimer);
    holdEndTimer = null;
  }
}

function getHoldTranscript(fallbackInterim = ""): string {
  return (holdAccumulated + holdLastInterim).trim() || fallbackInterim.trim();
}

function finishHoldSession(fallbackInterim = ""): void {
  const text = getHoldTranscript(fallbackInterim);
  holdAccumulated = "";
  holdLastInterim = "";
  clearHoldEndTimer();
  const resolve = holdEndResolve;
  const reject = holdEndReject;
  holdEndResolve = null;
  holdEndReject = null;
  if (text) resolve?.(text);
  else reject?.();
}

/** 按住说话：按下开始，松开结束并提交 */
export function startHoldListening(
  onInterim?: (text: string) => void,
  onError?: (error: string) => void
): void {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.("您的浏览器不支持语音识别");
    return;
  }

  if (isListening) stopListening();

  stopSpeaking();
  intentionalStop = false;
  holdAccumulated = "";
  holdLastInterim = "";
  clearHoldEndTimer();

  try {
    recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const current = recognition;

    recognition.onresult = (event: any) => {
      if (current !== recognition) return;
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          holdAccumulated += piece;
        } else {
          interim += piece;
        }
      }
      holdLastInterim = interim;
      onInterim?.(getHoldTranscript());
    };

    recognition.onerror = (event: any) => {
      if (current !== recognition) return;
      if (intentionalStop && event.error === "aborted") {
        intentionalStop = false;
        return;
      }
      if (intentionalStop && event.error === "no-speech") {
        intentionalStop = false;
        return;
      }
      isListening = false;
      intentionalStop = false;
      clearHoldEndTimer();
      holdEndResolve = null;
      holdEndReject = null;
      const errorMap: Record<string, string> = {
        "no-speech": "没有检测到语音，请再试一次",
        aborted: "语音识别被中断",
        "audio-capture": "无法访问麦克风",
        network: "网络不稳定，请检查网络后重试",
        "not-allowed": "麦克风权限被拒绝，请在浏览器设置中允许",
        "service-not-allowed": "语音识别服务不可用",
      };
      onError?.(errorMap[event.error] || event.error || "语音识别出错");
    };

    recognition.onend = () => {
      if (current !== recognition) return;
      isListening = false;
      intentionalStop = false;
      if (holdEndResolve || holdEndReject) {
        finishHoldSession();
      }
    };

    recognition.onstart = () => {
      isListening = true;
    };

    recognition.start();
  } catch {
    isListening = false;
    onError?.("语音识别启动失败");
  }
}

/** 松开按钮：等待 onend 拿最终结果，最多等 600ms */
export function endHoldListening(
  onResult: (text: string) => void,
  onEmpty?: () => void,
  fallbackInterim = ""
): void {
  holdEndResolve = onResult;
  holdEndReject = onEmpty ?? null;
  intentionalStop = true;

  const submitNow = () => {
    if (!holdEndResolve && !holdEndReject) return;
    finishHoldSession(fallbackInterim);
  };

  if (recognition) {
    try {
      recognition.stop();
    } catch (_) {
      submitNow();
    }
    clearHoldEndTimer();
    holdEndTimer = setTimeout(submitNow, 900);
  } else {
    submitNow();
  }
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
