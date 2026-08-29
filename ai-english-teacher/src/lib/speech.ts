// 语音工具模块 - 基于 Web Speech API
// 针对 Chrome 的 SpeechSynthesis 兼容性问题进行全面修复

let recognition: any = null;
let isListening = false;
let voicesLoaded = false;
let voicesPromise: Promise<void> | null = null;
let synthReady = false;

// 语音合成状态回调
type SpeakingStateCallback = (speaking: boolean) => void;
let onSpeakingStateChange: SpeakingStateCallback | null = null;

// 注册语音合成状态监听
export function setSpeakingStateCallback(cb: SpeakingStateCallback): void {
  onSpeakingStateChange = cb;
}

// 获取语音合成引擎
function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis;
}

// 加载语音列表（Chrome 需要异步加载）
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
      resolve();
      return;
    }

    // 等待 onvoiceschanged 事件
    synth.onvoiceschanged = () => {
      voicesLoaded = true;
      resolve();
    };

    // 超时保护（5秒后不再等待）
    setTimeout(() => {
      if (!voicesLoaded) {
        voicesLoaded = true;
        resolve();
      }
    }, 5000);
  });

  return voicesPromise;
}

// 初始化语音引擎 - 由用户手势触发
export function warmUpSpeech(): boolean {
  const synth = getSynth();
  if (!synth) return false;

  try {
    // 加载语音
    loadVoices();

    // 唤醒引擎
    if (synth.paused) {
      synth.resume();
    }

    // 尝试一次空播报来激活引擎
    const testUtterance = new SpeechSynthesisUtterance("");
    testUtterance.volume = 0;
    testUtterance.rate = 1;
    testUtterance.text = " ";
    synth.speak(testUtterance);
    synth.cancel();

    synthReady = true;
    return true;
  } catch (e) {
    console.warn("[Speech] Warmup failed:", e);
    return false;
  }
}

// 获取可用语音列表
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  const synth = getSynth();
  if (!synth) return [];
  try {
    return synth.getVoices();
  } catch {
    return [];
  }
}

// 检查语音合成是否可用
export function isSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const synth = window.speechSynthesis;
  return !!synth;
}

// 播报文本（TTS） - 增强版
export function speak(text: string, onEnd?: () => void, speed?: number): boolean {
  const synth = getSynth();
  if (!synth) {
    console.warn("[Speech] SpeechSynthesis not available");
    return false;
  }

  try {
    // 确保语音已加载
    loadVoices();

    // 取消之前的播报
    synth.cancel();

    // 确保引擎未暂停
    if (synth.paused) {
      synth.resume();
    }

    // 创建新的发声实例
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = speed ?? 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    // 选择中文语音
    try {
      const voices = synth.getVoices();
      // 优先找中文女声
      const zhVoice = voices.find(
        (v) => v.lang.startsWith("zh") && /female|女|xiaoyi|xiaoxuan|xiaoyan|yaoyao/i.test(v.name)
      ) || voices.find(
        (v) => v.lang.startsWith("zh")
      );
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
    } catch (_) {}

    // 状态更新
    onSpeakingStateChange?.(true);

    utterance.onstart = () => {
      console.log("[Speech] Started speaking");
    };

    utterance.onend = () => {
      console.log("[Speech] Finished speaking");
      onSpeakingStateChange?.(false);
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn("[Speech] Speak error:", e.error || e);
      onSpeakingStateChange?.(false);
      onEnd?.();
    };

    // 真正开始播报
    synth.speak(utterance);
    console.log("[Speech] Speaking:", text.substring(0, 40));
    return true;
  } catch (e) {
    console.warn("[Speech] Speak failed:", e);
    onSpeakingStateChange?.(false);
    return false;
  }
}

// 朗读英文（增强版）
export function speakEnglish(text: string): boolean {
  const synth = getSynth();
  if (!synth) return false;

  try {
    loadVoices();

    synth.cancel();
    if (synth.paused) synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    try {
      const voices = synth.getVoices();
      // 优先找英文女声
      const enVoice = voices.find(
        (v) => v.lang.startsWith("en") && /female|女|samantha|google/i.test(v.name)
      ) || voices.find(
        (v) => v.lang.startsWith("en")
      );
      if (enVoice) utterance.voice = enVoice;
    } catch (_) {}

    onSpeakingStateChange?.(true);

    utterance.onstart = () => {
      console.log("[Speech] Started English speaking");
    };

    utterance.onend = () => {
      console.log("[Speech] Finished English speaking");
      onSpeakingStateChange?.(false);
    };

    utterance.onerror = (e) => {
      console.warn("[Speech] SpeakEnglish error:", e.error || e);
      onSpeakingStateChange?.(false);
    };

    synth.speak(utterance);
    return true;
  } catch (e) {
    console.warn("[Speech] SpeakEnglish failed:", e);
    onSpeakingStateChange?.(false);
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
      const errorMap: Record<string, string> = {
        "no-speech": "没有检测到语音",
        "aborted": "语音识别被中断",
        "audio-capture": "无法访问麦克风",
        "network": "网络错误",
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
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// 取消所有语音播报
export function cancelSpeech(): void {
  const synth = getSynth();
  if (synth) {
    synth.cancel();
    onSpeakingStateChange?.(false);
  }
}