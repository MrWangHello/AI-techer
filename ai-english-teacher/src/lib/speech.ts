// 语音工具模块 - 基于 Web Speech API

let recognition: any = null;
let isListening = false;

// 获取语音合成引擎
function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis;
}

// 播报文本（TTS）
export function speak(text: string, onEnd?: () => void, speed?: number): boolean {
  const synth = getSynth();
  if (!synth) {
    console.warn("[Speech] SpeechSynthesis not available");
    return false;
  }

  try {
    // 取消之前的播报
    synth.cancel();

    // 确保引擎未暂停（Chrome 的需要）
    if (synth.paused) {
      synth.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = speed ?? 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    // 选择中文语音（如果可用）
    try {
      const voices = synth.getVoices();
      // 优先找中文女声
      const zhVoice = voices.find(
        (v) => v.lang.startsWith("zh") && /female|女/i.test(v.name)
      );
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
    } catch (_) {}

    if (onEnd) {
      utterance.onend = onEnd;
    }

    utterance.onerror = (e) => {
      console.warn("[Speech] Speak error:", e.error || e);
      onEnd?.();
    };

    synth.speak(utterance);
    console.log("[Speech] Speaking:", text.substring(0, 30));
    return true;
  } catch (e) {
    console.warn("[Speech] Speak failed:", e);
    return false;
  }
}

// 朗读英文单词
export function speakEnglish(text: string): boolean {
  const synth = getSynth();
  if (!synth) return false;

  try {
    synth.cancel();
    if (synth.paused) synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    try {
      const voices = synth.getVoices();
      const enVoice = voices.find(
        (v) => v.lang.startsWith("en") && /female|女/i.test(v.name)
      );
      if (enVoice) utterance.voice = enVoice;
    } catch (_) {}

    utterance.onerror = (e) => {
      console.warn("[Speech] SpeakEnglish error:", e.error || e);
    };

    synth.speak(utterance);
    return true;
  } catch (e) {
    console.warn("[Speech] SpeakEnglish failed:", e);
    return false;
  }
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
      isListening = false;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      isListening = false;
      onError?.(event.error || "语音识别出错");
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

// 停止语音识别
export function stopListening(): void {
  if (recognition && isListening) {
    try {
      recognition.stop();
    } catch (_) {}
  }
  isListening = false;
}

// 当前是否在监听
export function getIsListening(): boolean {
  return isListening;
}

// 检测语音合成是否可用
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

// 检测语音识别是否可用
export function isSTTSupported(): boolean {
  return typeof window !== "undefined" &&
    !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}