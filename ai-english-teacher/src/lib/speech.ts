// 语音工具模块 - 基于 Web Speech API，零成本

let speechSynth: SpeechSynthesis | null = null;
let recognition: any = null;
let isListening = false;
let onResultCallback: ((text: string) => void) | null = null;
let isWarmedUp = false;

// 初始化语音合成
export function initSpeech(): boolean {
  if (typeof window === "undefined") return false;
  speechSynth = window.speechSynthesis;
  return !!speechSynth;
}

/**
 * 预热语音引擎 - 必须在用户手势（点击）中调用
 * Chrome 要求语音合成必须在用户手势上下文中首次触发
 */
export function warmUpSpeech(): void {
  if (typeof window === "undefined") return;
  if (isWarmedUp) return;

  if (!speechSynth) {
    if (!initSpeech()) return;
  }

  try {
    // 在用户手势中创建并播放一个无声的短语音
    // 这会"解锁"浏览器对 SpeechSynthesis 的限制
    speechSynth!.cancel();

    // 预加载语音列表
    speechSynth!.getVoices();

    // 创建一个短的无声音频来预热引擎
    const warmup = new SpeechSynthesisUtterance("");
    warmup.volume = 0; // 无声
    warmup.rate = 1;
    warmup.pitch = 1;
    speechSynth!.speak(warmup);

    // 确保引擎恢复
    if (speechSynth!.paused) {
      speechSynth!.resume();
    }

    isWarmedUp = true;
    console.log("[Speech] Engine warmed up successfully");
  } catch (e) {
    console.warn("[Speech] Warmup failed:", e);
  }
}

// 播报文本（TTS）
export function speak(text: string, onEnd?: () => void, speed?: number): void {
  if (!speechSynth) {
    if (!initSpeech()) return;
  }

  // 取消之前的播报
  speechSynth!.cancel();

  // 确保引擎未暂停
  if (speechSynth!.paused) {
    speechSynth!.resume();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = speed ?? 1.0;
  utterance.pitch = 1.1;
  utterance.volume = 1;

  // 选择中文语音
  const voices = speechSynth!.getVoices();
  const zhVoice = voices.find(
    (v) => v.lang.startsWith("zh") && v.name.includes("Female")
  );
  if (zhVoice) utterance.voice = zhVoice;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  utterance.onerror = (e) => {
    console.warn("[Speech] Speak error:", e);
    // 如果出错，尝试重新预热
    isWarmedUp = false;
  };

  speechSynth!.speak(utterance);
}

// 朗读英文单词
export function speakEnglish(text: string): void {
  if (!speechSynth) {
    if (!initSpeech()) return;
  }

  speechSynth!.cancel();

  if (speechSynth!.paused) {
    speechSynth!.resume();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  const voices = speechSynth!.getVoices();
  const enVoice = voices.find(
    (v) => v.lang.startsWith("en") && v.name.includes("Female")
  );
  if (enVoice) utterance.voice = enVoice;

  utterance.onerror = (e) => {
    console.warn("[Speech] SpeakEnglish error:", e);
    isWarmedUp = false;
  };

  speechSynth!.speak(utterance);
}

// 开始语音识别（STT）
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

  try {
    recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResultCallback = null;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      isListening = false;
      onError?.(event.error || "语音识别出错");
    };

    recognition.onend = () => {
      isListening = false;
    };

    onResultCallback = onResult;
    recognition.start();
    isListening = true;
  } catch (e) {
    isListening = false;
    onError?.("语音识别启动失败");
  }
}

// 停止语音识别
export function stopListening(): void {
  if (recognition && isListening) {
    try {
      recognition.stop();
    } catch (e) {
      // 忽略
    }
  }
  isListening = false;
}

// 当前是否在监听
export function getIsListening(): boolean {
  return isListening;
}

// 预加载语音
export function preloadVoices(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }
}