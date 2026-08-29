// 语音工具模块 - 基于 Web Speech API，零成本

let speechSynth: SpeechSynthesis | null = null;
let recognition: any = null;
let isListening = false;
let onResultCallback: ((text: string) => void) | null = null;

// 初始化语音合成
export function initSpeech(): boolean {
  if (typeof window === "undefined") return false;
  speechSynth = window.speechSynthesis;
  return !!speechSynth;
}

// 播报文本（TTS）
export function speak(text: string, onEnd?: () => void): void {
  if (!speechSynth) {
    if (!initSpeech()) return;
  }
  // 取消之前的播报
  speechSynth!.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.0;
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

  speechSynth!.speak(utterance);
}

// 朗读英文单词
export function speakEnglish(text: string): void {
  if (!speechSynth) {
    if (!initSpeech()) return;
  }
  speechSynth!.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  const voices = speechSynth!.getVoices();
  const enVoice = voices.find(
    (v) => v.lang.startsWith("en") && v.name.includes("Female")
  );
  if (enVoice) utterance.voice = enVoice;

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