"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Keyboard, Send, Volume1, Loader2 } from "lucide-react";
import {
  startListening,
  startHoldListening,
  endHoldListening,
  stopListening,
  speak,
  speakAfterMic,
  stopSpeaking,
  isSpeechSupported,
} from "@/lib/speech";
import { decideSttEngine, hasWebSpeechApi, readSttPref, type SttEngine } from "@/lib/speech-probe";
import {
  ensureLocalModel,
  finishLocalRecording,
  isLocalMarkedReady,
  startLocalRecording,
  stopLocalRecording,
  subscribeLocalStt,
} from "@/lib/speech-local";
import { handleUserMessage, AgentResponse } from "@/lib/mock-agent";

export type InputMode = "voice" | "text";

interface VoiceChatBarProps {
  onAgentResponse: (response: AgentResponse) => void;
  onTranscript?: (text: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  voiceSpeed?: number;
}

const HOLD_DELAY_MS = 320;

export default function VoiceChatBar({
  onAgentResponse,
  onTranscript,
  onSpeakingChange,
  voiceSpeed = 1.0,
}: VoiceChatBarProps) {
  const [mode, setMode] = useState<InputMode>("voice");
  const [listening, setListening] = useState(false);
  const [holding, setHolding] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [sttAvailable, setSttAvailable] = useState(true);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const [sttEngine, setSttEngine] = useState<SttEngine>("webspeech");
  const [packHint, setPackHint] = useState<string | null>(null);
  const localTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const holdActive = useRef(false);
  const holdMode = useRef(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimRef = useRef("");
  const voiceBtnRef = useRef<HTMLButtonElement>(null);
  const pointerIdRef = useRef<number | null>(null);

  const stopListeningUi = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (localTapTimer.current) {
      clearTimeout(localTapTimer.current);
      localTapTimer.current = null;
    }
    stopListening();
    stopLocalRecording();
    if (isMounted.current) {
      setListening(false);
      setHolding(false);
      setInterimText("");
    }
    holdActive.current = false;
    holdMode.current = false;
    interimRef.current = "";
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const web = hasWebSpeechApi(window);
    const decision = decideSttEngine({
      webSpeechApi: web,
      ua: navigator.userAgent,
      pref: readSttPref(),
      localReady: isLocalMarkedReady(),
    });
    setSttEngine(decision.engine === "none" && decision.shouldPrefetch ? "local" : decision.engine);
    setTtsAvailable(isSpeechSupported());
    const canVoice = decision.engine !== "none" || decision.shouldPrefetch;
    setSttAvailable(canVoice);
    if (!canVoice) setMode("text");

    if (decision.shouldPrefetch) {
      setPackHint("正在给 Bella 装耳朵…");
      void ensureLocalModel().then((ok) => {
        if (!isMounted.current) return;
        if (ok) {
          setSttEngine("local");
          setSttAvailable(true);
          setPackHint("离线耳朵准备好了，可以说话");
          setTimeout(() => {
            if (isMounted.current) setPackHint(null);
          }, 2500);
        } else {
          setPackHint(null);
          if (!web) {
            setSttAvailable(false);
            setMode("text");
            setHint("离线语音包装不上，请用文字输入");
          }
        }
      });
    }

    return () => {
      isMounted.current = false;
      try {
        stopListening();
      } catch (_) {}
      stopLocalRecording();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    return subscribeLocalStt((s) => {
      if (s.status === "downloading" && s.progress > 0) {
        setPackHint(`正在给 Bella 装耳朵… ${s.progress}%`);
      }
    });
  }, []);

  const showHint = useCallback((msg: string, ms = 3500) => {
    setHint(msg);
    setTimeout(() => {
      if (isMounted.current) setHint(null);
    }, ms);
  }, []);

  const playReply = useCallback(
    async (reply: string, afterMic: boolean) => {
      if (!ttsAvailable || !reply.trim()) return;

      setSpeaking(true);
      onSpeakingChange?.(true);

      const onEnd = () => {
        if (!isMounted.current) return;
        setSpeaking(false);
        onSpeakingChange?.(false);
      };

      const success = afterMic
        ? await speakAfterMic(reply, onEnd, voiceSpeed)
        : speak(reply, onEnd, voiceSpeed);

      if (!success && isMounted.current) {
        setSpeaking(false);
        onSpeakingChange?.(false);
      }
    },
    [onSpeakingChange, ttsAvailable, voiceSpeed]
  );

  const handleAgentReply = useCallback(
    async (text: string, afterMic: boolean) => {
      stopListeningUi();
      setThinking(true);
      try {
        const response = await handleUserMessage({ text, channel: "web" });
        if (!isMounted.current) return;
        onAgentResponse(response);
        await playReply(response.reply, afterMic);
      } catch {
        if (isMounted.current) showHint("处理失败了，请再试一次");
      } finally {
        if (isMounted.current) setThinking(false);
      }
    },
    [onAgentResponse, playReply, showHint, stopListeningUi]
  );

  const submitText = useCallback(() => {
    const text = textInput.trim();
    if (!text || thinking) return;
    setTextInput("");
    onTranscript?.(text);
    void handleAgentReply(text, false);
  }, [textInput, thinking, onTranscript, handleAgentReply]);

  const switchToText = useCallback(() => {
    stopListeningUi();
    setMode("text");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [stopListeningUi]);

  const switchToVoice = useCallback(() => {
    if (!sttAvailable) {
      showHint("当前浏览器不支持语音，请使用文字输入");
      return;
    }
    setMode("voice");
  }, [sttAvailable, showHint]);

  const toggleMode = useCallback(() => {
    if (mode === "voice") switchToText();
    else switchToVoice();
  }, [mode, switchToText, switchToVoice]);

  const finishLocalUtterance = useCallback(async () => {
    if (localTapTimer.current) {
      clearTimeout(localTapTimer.current);
      localTapTimer.current = null;
    }
    setListening(false);
    setHolding(false);
    setInterimText("Bella 在听…");
    try {
      const text = await finishLocalRecording();
      if (!isMounted.current) return;
      setInterimText("");
      if (!text) {
        showHint("没有听清，请再试一次");
        return;
      }
      onTranscript?.(text);
      void handleAgentReply(text, true);
    } catch (err) {
      if (!isMounted.current) return;
      setInterimText("");
      showHint(err instanceof Error ? err.message : "离线识别失败，请打字");
    }
  }, [handleAgentReply, onTranscript, showHint]);

  const startLocalTap = useCallback(async () => {
    stopSpeaking();
    setListening(true);
    setInterimText("正在听…");
    try {
      await startLocalRecording();
      localTapTimer.current = setTimeout(() => {
        void finishLocalUtterance();
      }, 5000);
    } catch (_) {
      setListening(false);
      setInterimText("");
      showHint("打不开麦克风，请用文字输入");
      switchToText();
    }
  }, [finishLocalUtterance, showHint, switchToText]);

  /** 点击说话（更稳定，恢复原有模式） */
  const startTapVoice = useCallback(() => {
    if (thinking || speaking) return;
    if (!sttAvailable) {
      switchToText();
      showHint("语音识别不可用，已切换为文字输入");
      return;
    }

    stopListening();
    stopSpeaking();
    setListening(true);
    setInterimText("");

    if (sttEngine === "local") {
      void startLocalTap();
      return;
    }

    startListening(
      (text) => {
        if (!isMounted.current) return;
        setListening(false);
        onTranscript?.(text);
        void handleAgentReply(text, true);
      },
      (err) => {
        if (!isMounted.current) return;
        stopListeningUi();
        const soft = ["没有检测到语音", "被中断", "网络不稳定"].some((s) => err.includes(s));
        if (!soft) {
          setPackHint("正在给 Bella 装耳朵…");
          void ensureLocalModel().then((ok) => {
            if (!isMounted.current) return;
            if (ok) {
              setSttEngine("local");
              setPackHint(null);
              showHint("已换离线耳朵，请再说一次");
            } else {
              setPackHint(null);
              showHint(`${err}，已切换文字输入`);
              switchToText();
            }
          });
          return;
        }
        showHint(`${err}（再点一次试试）`);
      },
      () => {
        if (!isMounted.current) return;
        setListening(false);
      }
    );
  }, [
    sttAvailable,
    sttEngine,
    thinking,
    speaking,
    onTranscript,
    handleAgentReply,
    switchToText,
    showHint,
    stopListeningUi,
    startLocalTap,
  ]);

  const beginHold = useCallback(() => {
    if (thinking || speaking || holdActive.current) return;
    if (!sttAvailable) {
      switchToText();
      return;
    }

    stopSpeaking();
    holdActive.current = true;
    holdMode.current = true;
    setHolding(true);
    setListening(true);
    setInterimText("");
    interimRef.current = "";

    if (sttEngine === "local") {
      void startLocalRecording().catch(() => {
        stopListeningUi();
        showHint("打不开麦克风，请用文字输入");
      });
      return;
    }

    startHoldListening(
      (text) => {
        interimRef.current = text;
        if (isMounted.current) setInterimText(text);
      },
      (err) => {
        if (!isMounted.current) return;
        stopListeningUi();
        const soft = ["没有检测到语音", "被中断", "网络不稳定"].some((s) => err.includes(s));
        showHint(soft ? `${err}（再点一次试试）` : err);
      }
    );
  }, [thinking, speaking, sttAvailable, sttEngine, switchToText, showHint, stopListeningUi]);

  const finishHold = useCallback(() => {
    if (!holdActive.current) return;
    holdActive.current = false;
    setHolding(false);
    setListening(false);

    if (sttEngine === "local") {
      void finishLocalUtterance();
      return;
    }

    endHoldListening(
      (text) => {
        setInterimText("");
        interimRef.current = "";
        onTranscript?.(text);
        void handleAgentReply(text, true);
      },
      () => {
        setInterimText("");
        interimRef.current = "";
        showHint("没听清，请再试一次（也可点一下说话）");
      },
      interimRef.current
    );
  }, [onTranscript, handleAgentReply, showHint, sttEngine, finishLocalUtterance]);

  const releasePointer = useCallback((e: React.PointerEvent) => {
    pointerIdRef.current = null;
    try {
      voiceBtnRef.current?.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }, []);

  const onVoicePressStart = useCallback(
    (e: React.PointerEvent) => {
      if (thinking || speaking) return;
      e.preventDefault();
      holdMode.current = false;
      pointerIdRef.current = e.pointerId;
      try {
        voiceBtnRef.current?.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (pressTimer.current) clearTimeout(pressTimer.current);
      pressTimer.current = setTimeout(() => {
        pressTimer.current = null;
        beginHold();
      }, HOLD_DELAY_MS);
    },
    [thinking, speaking, beginHold]
  );

  const onVoicePressEnd = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      releasePointer(e);
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
        if (!holdMode.current && !thinking && !speaking) {
          startTapVoice();
        }
        return;
      }
      if (holdMode.current) {
        finishHold();
      }
    },
    [startTapVoice, finishHold, thinking, speaking, releasePointer]
  );

  const onVoicePressCancel = useCallback(
    (e: React.PointerEvent) => {
      releasePointer(e);
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
        return;
      }
      if (holdMode.current) {
        stopListeningUi();
      }
    },
    [releasePointer, stopListeningUi]
  );

  const busy = listening || speaking || thinking;

  return (
    <div className="shrink-0 bg-white border-t border-pink-100 px-3 pt-2 pb-2 max-w-lg mx-auto w-full">
      {(hint || packHint) && (
        <p className="text-sm text-amber-700 text-center mb-1.5 animate-fadeIn">{hint || packHint}</p>
      )}

      {interimText && (holding || listening) && (
        <p className="text-sm text-gray-600 text-center mb-1.5 px-2 break-words whitespace-pre-wrap">{interimText}</p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={toggleMode}
          disabled={busy}
          className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-gray-500 hover:text-pink-500 hover:bg-pink-50 active:scale-95 transition-all disabled:opacity-40"
          aria-label={mode === "voice" ? "切换到键盘输入" : "切换到语音输入"}
        >
          {mode === "voice" ? <Keyboard className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {mode === "voice" ? (
          <button
            ref={voiceBtnRef}
            type="button"
            onPointerDown={onVoicePressStart}
            onPointerUp={onVoicePressEnd}
            onPointerCancel={onVoicePressCancel}
            onContextMenu={(e) => e.preventDefault()}
            disabled={speaking || thinking}
            className={`
              flex-1 min-h-14 h-14 rounded-full flex items-center justify-center gap-2
              text-base font-medium transition-all select-none touch-none
              ${
                holding
                  ? "bg-red-50 text-red-500 border border-red-200 scale-[0.98]"
                  : listening
                  ? "bg-red-50 text-red-500 border border-red-200 animate-pulse"
                  : thinking
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : speaking
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100 active:scale-[0.98]"
              }
            `}
          >
            {holding ? (
              <>
                <Mic className="w-6 h-6 animate-pulse" />
                松手发送...
              </>
            ) : listening ? (
              <>
                <Mic className="w-6 h-6" />
                正在听...
              </>
            ) : thinking ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Bella 在想...
              </>
            ) : speaking ? (
              <>
                <Volume1 className="w-6 h-6 animate-pulse" />
                Bella 正在说话...
              </>
            ) : (
              <>
                <Mic className="w-6 h-6" />
                点击说话 · 长按连说
              </>
            )}
          </button>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
            placeholder="输入文字与 Bella 对话..."
            disabled={thinking}
            className="flex-1 min-h-14 h-14 px-4 text-base bg-gray-50 border border-pink-100 rounded-full focus:outline-none focus:border-pink-300 focus:bg-white disabled:opacity-60"
          />
        )}

        {mode === "text" && (
          <button
            type="button"
            onClick={submitText}
            disabled={!textInput.trim() || thinking}
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-40 active:scale-95 transition-all"
            aria-label="发送"
          >
            {thinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        )}
      </div>
      <p className="text-sm text-center text-gray-500 mt-1.5">轻点说一句 · 长按连续说 · 键盘切文字</p>
    </div>
  );
}
