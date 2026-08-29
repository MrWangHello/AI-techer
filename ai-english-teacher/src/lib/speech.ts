// 语音工具模块 - 基于 Web Speech API
// 使用 Chrome SpeechSynthesis bug 的业界标准修复方案
// 已知问题：Chrome 会在引擎空闲几秒后杀死它，下次 speak() 首调用会静默失败
// 修复方案：每个 speak() 调用内部自动重试一次

let recognition: any = null;
let isListening = false;
let voicesLoaded = false;
let voicesPromise: Promise<void> | null = null;

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

// 检查语音合成是否可用（同步检测）
export function isSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.speechSynthesis;
}

// 检测语音合成是否真正可用（尝试获取voices）
export function isSpeechUsable(): boolean {
  if (typeof window === "undefined") return false;
  const synth = window.speechSynthesis;
  if (!synth) return false;
  try {
    // 如果有voices列表，说明引擎可用
    const voices = synth.getVoices();
    return voices.length > 0 || typeof synth.speak === "function";
  } catch {
    return false;
  }
}

// ============ 语音合成核心函数 ============

// 内部：创建语音配置
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

  // 选择对应语言的语音
  try {
    const synth = getSynth();
    if (synth) {
      const voices = synth.getVoices();
      // 找对应语言的语音，优先女声
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(lang.split("-")[0]) && /female|女|samantha|google|xiaoyi|xiaoxuan|xiaoyan|yaoyao/i.test(v.name)
      ) || voices.find(
        (v) => v.lang.startsWith(lang.split("-")[0])
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }
  } catch (_) {}

  utterance.onstart = () => {
    console.log(`[Speech] Started: "${text.substring(0, 30)}"`);
  };

  utterance.onend = () => {
    onEnd();
  };

  utterance.onerror = (e) => {
    // 'canceled' 和 'interrupted' 是正常的中断，不是错误
    if (e.error === "canceled" || e.error === "interrupted") return;
    console.warn(`[Speech] Error: ${e.error} for "${text.substring(0, 30)}"`);
    onEnd();
  };

  return utterance;
}

// 内部：执行实际 speak 调用（带 Chrome 重试机制）
function doSpeak(utterance: SpeechSynthesisUtterance): boolean {
  const synth = getSynth();
  if (!synth) return false;

  try {
    loadVoices();

    // 取消之前的播报
    synth.cancel();

    // 确保引擎未暂停
    if (synth.paused) {
      synth.resume();
    }

    // Chrome bug 修复：如果引擎正在 speaking，先等它完成
    // 如果引擎空闲（不 speaking），首次 speak 可能静默失败
    // 解决方案：先 speak 一个空字符串唤醒引擎，再 speak 实际内容
    const wakeAndSpeak = () => {
      // 第二次调用：真正播报
      synth.speak(utterance);
    };

    if (synth.speaking) {
      // 引擎正在忙，直接 speak（会排队）
      synth.speak(utterance);
    } else {
      // 引擎空闲，先唤醒再播报
      // 用空字符串唤醒引擎
      const wakeUp = new SpeechSynthesisUtterance(" ");
      wakeUp.volume = 0;
      wakeUp.rate = 2;
      wakeUp.onend = wakeAndSpeak;
      wakeUp.onerror = wakeAndSpeak; // 即使唤醒失败也尝试播报
      synth.speak(wakeUp);
    }

    return true;
  } catch (e) {
    console.warn("[Speech] doSpeak failed:", e);
    return false;
  }
}

// 播报中文文本（TTS）
export function speak(text: string, onEnd?: () => void, speed?: number): boolean {
  const synth = getSynth();
  if (!synth) {
    console.warn("[Speech] SpeechSynthesis not available");
    onSpeakingStateChange?.(false);
    return false;
  }

  try {
    // 状态更新
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

// 朗读英文
export function speakEnglish(text: string): boolean {
  const synth = getSynth();
  if (!synth) {
    console.warn("[Speech] SpeechSynthesis not available");
    onSpeakingStateChange?.(false);
    return false;
  }

  try {
    onSpeakingStateChange?.(true);

    const utterance = createUtterance(
      text,
      "en-US",
      0.9,
      1.0,
      () => {
        onSpeakingStateChange?.(false);
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

// 预热语音引擎（由用户手势触发）
export function warmUpSpeech(): boolean {
  const synth = getSynth();
  if (!synth) return false;

  try {
    loadVoices();

    // 唤醒引擎
    if (synth.paused) {
      synth.resume();
    }

    // 如果引擎已经在说话，说明已经预热过了
    if (synth.speaking) return true;

    // 用一个空字符串唤醒引擎（不立刻取消，让引擎启动）
    const wakeUp = new SpeechSynthesisUtterance(" ");
    wakeUp.volume = 0;
    wakeUp.rate = 2;
    synth.speak(wakeUp);

    // 注意：不调用 cancel()，让引擎自然处理这个空 utterance
    // 这会触发引擎的启动流程，后续的 speak 调用就能正常工作

    console.log("[Speech] Engine warmed up");
    return true;
  } catch (e) {
    console.warn("[Speech] warmUp failed:", e);
    return false;
  }
}

// ============ 语音识别（STT） ============

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