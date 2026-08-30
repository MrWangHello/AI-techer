/**
 * 语音工具模块
 * 
 * TTS：通过 Cloudflare Worker 调用 Edge-TTS，返回 MP3 音频播放
 * STT：使用浏览器 Web Speech API（语音识别）
 * 
 * 环境变量：
 * - NEXT_PUBLIC_TTS_WORKER_URL: Edge-TTS Worker 地址
 *   默认值：https://ai-teacher-tts.你的用户名.workers.dev
 *   部署 Worker 后需要修改此地址
 */

// ============ TTS Worker 配置 ============

const TTS_WORKER_URL = process.env.NEXT_PUBLIC_TTS_WORKER_URL || 'https://ai-teacher-tts.你的用户名.workers.dev';
const TTS_WORKER_CONFIGURED = !TTS_WORKER_URL.includes('你的用户名');

// 默认音色（可通过环境变量覆盖）
// NEXT_PUBLIC_TTS_VOICE_ZH: 中文朗读音色，默认 晓晓（温柔女声）
// NEXT_PUBLIC_TTS_VOICE_EN: 英文朗读音色，默认 Aria（美式女声）
const VOICES = {
  'zh-CN': process.env.NEXT_PUBLIC_TTS_VOICE_ZH || 'zh-CN-XiaoxiaoNeural',
  'en-US': process.env.NEXT_PUBLIC_TTS_VOICE_EN || 'en-US-AriaNeural',
};

// ============ 语音合成状态管理 ============

let currentAudio: HTMLAudioElement | null = null;
let nativeUtterance: SpeechSynthesisUtterance | null = null;
let isSpeaking = false;

type SpeakingStateCallback = (speaking: boolean) => void;
let onSpeakingStateChange: SpeakingStateCallback | null = null;

export function setSpeakingStateCallback(cb: SpeakingStateCallback): void {
  onSpeakingStateChange = cb;
}

// ============ TTS 核心函数 ============

/**
 * 获取可用音色列表
 */
export async function getAvailableVoices(): Promise<Array<{ name: string; locale: string; gender: string; friendlyName: string }>> {
  try {
    const resp = await fetch(`${TTS_WORKER_URL}/voices`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return [];
    return await resp.json();
  } catch (e) {
    console.warn('[TTS] Failed to fetch voices:', e);
    return [];
  }
}

/**
 * 检查 TTS Worker 是否可用
 */
export async function checkTTSAvailable(): Promise<boolean> {
  try {
    const resp = await fetch(`${TTS_WORKER_URL}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * 内部：通过 Edge-TTS Worker 合成并播放
 * 返回 true 表示播放完成，false 表示失败（调用方可回退到原生）
 */
async function synthesizeViaWorker(
  text: string,
  voice: string,
  lang: string,
  speed: number | undefined,
): Promise<boolean> {
  // 速率映射：speed 1.0 → rate 0，speed 1.5 → +50%，speed 0.8 → -20%
  const rate = speed ? Math.round((speed - 1) * 100) : 0;

  const resp = await fetch(`${TTS_WORKER_URL}/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate, lang }),
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const audioBlob = await resp.blob();
  if (audioBlob.size === 0) {
    throw new Error('Empty audio response');
  }

  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  currentAudio = audio;

  return new Promise((resolve) => {
    audio.onended = () => {
      cleanup(audioUrl);
      resolve(true);
    };
    audio.onerror = () => {
      console.warn('[TTS] Audio playback error');
      cleanup(audioUrl);
      resolve(false);
    };
    audio.play().catch((e) => {
      console.warn('[TTS] Audio play failed:', e);
      cleanup(audioUrl);
      resolve(false);
    });
  });
}

/**
 * 内部：使用浏览器原生 SpeechSynthesis 合成并播放（fallback）
 * 返回 true 表示播放完成，false 表示不可用或失败
 */
function synthesizeViaNative(
  text: string,
  lang: string,
  speed: number | undefined,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(false);
      return;
    }
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = speed ?? 1;

      // 尝试选择匹配语言的音色
      const voices = window.speechSynthesis.getVoices();
      const matched =
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
      if (matched) utter.voice = matched;

      utter.onend = () => resolve(true);
      utter.onerror = () => resolve(false);

      nativeUtterance = utter;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('[TTS] Native synthesis failed:', e);
      resolve(false);
    }
  });
}

/**
 * 内部：合成并播放（优先 Edge-TTS Worker，失败回退原生 SpeechSynthesis）
 */
async function synthesizeAndPlay(
  text: string,
  voice: string,
  lang: string,
  onEnd?: () => void,
  speed?: number,
): Promise<boolean> {
  // 取消之前的播放
  stopSpeaking();

  isSpeaking = true;
  onSpeakingStateChange?.(true);

  let success = false;

  // 1. 优先使用 Edge-TTS Worker（已配置时）
  if (TTS_WORKER_CONFIGURED) {
    try {
      success = await synthesizeViaWorker(text, voice, lang, speed);
    } catch (e) {
      console.warn('[TTS] Edge-TTS Worker failed, falling back to native:', (e as Error).message);
      success = false;
    }
  }

  // 2. 回退到浏览器原生 SpeechSynthesis
  if (!success) {
    success = await synthesizeViaNative(text, lang, speed);
    if (!success) {
      console.warn('[TTS] Native SpeechSynthesis unavailable or failed');
    }
  }

  isSpeaking = false;
  onSpeakingStateChange?.(false);
  onEnd?.();
  return success;
}

function cleanup(audioUrl: string) {
  URL.revokeObjectURL(audioUrl);
  if (currentAudio) {
    currentAudio = null;
  }
}

/**
 * 停止播放
 */
export function stopSpeaking(): void {
  // 停止 Edge-TTS 音频
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  // 停止原生 SpeechSynthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  nativeUtterance = null;
  if (isSpeaking) {
    isSpeaking = false;
    onSpeakingStateChange?.(false);
  }
}

/**
 * 播报中文文本
 * @param text 要朗读的文本
 * @param onEnd 播放结束回调
 * @param speed 语速（1.0 = 正常）
 * @returns 是否成功发起请求
 */
export function speak(text: string, onEnd?: () => void, speed?: number): boolean {
  if (!text.trim()) {
    onSpeakingStateChange?.(false);
    onEnd?.();
    return false;
  }
  // 异步触发，返回 true 表示已发起请求（Worker 不可用时自动回退原生）
  synthesizeAndPlay(text, VOICES['zh-CN'], 'zh-CN', onEnd, speed);
  return true;
}

/**
 * 朗读英文
 * @param text 要朗读的英文文本
 * @returns 是否成功发起请求
 */
export function speakEnglish(text: string): boolean {
  if (!text.trim()) {
    onSpeakingStateChange?.(false);
    return false;
  }
  synthesizeAndPlay(text, VOICES['en-US'], 'en-US');
  return true;
}

// 别名兼容
export const cancelSpeech = stopSpeaking;

// 预热（不再需要，保留接口兼容）
export function warmUpSpeech(): boolean {
  return true;
}

// ============ 语音检测 ============

/**
 * 检测 TTS 是否可用（检查 Worker 是否在线）
 * 注意：这是一个异步函数，调用者需要 await
 */
export async function isSpeechAvailableAsync(): Promise<boolean> {
  return checkTTSAvailable();
}

/**
 * 同步检测（仅检查浏览器环境）
 */
export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 同步检测（始终返回 true，实际可用性由 isSpeechAvailableAsync 判断）
 */
export function isSpeechSupported(): boolean {
  return true;
}

// ============ 语音识别（STT）- 保持不变 ============

let recognition: any = null;
let isListening = false;

export function startListening(
  onResult: (text: string) => void,
  onError?: (error: string) => void
): void {
  if (typeof window === 'undefined') return;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.('您的浏览器不支持语音识别');
    return;
  }

  if (isListening) return;

  try {
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
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
        'no-speech': '没有检测到语音',
        'aborted': '语音识别被中断',
        'audio-capture': '无法访问麦克风',
        'network': '网络错误',
        'not-allowed': '麦克风权限被拒绝',
        'service-not-allowed': '语音识别服务不可用',
        'bad-grammar': '语法错误',
        'language-not-supported': '不支持的语言',
      };
      onError?.(errorMap[event.error] || event.error || '语音识别出错');
    };

    recognition.onend = () => {
      isListening = false;
    };

    recognition.start();
    isListening = true;
  } catch (e) {
    isListening = false;
    onError?.('语音识别启动失败');
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

export function isSTTSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function getAvailableVoicesSync(): any[] {
  return [];
}