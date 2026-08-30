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
  isTtsOutputAvailable,
} from "@/lib/speech";
import { decideSttEngine, decideTtsEngine, hasWebSpeechApi, readSttPref, type SttEngine } from "@/lib/speech-probe";
import {
  ensureLocalModel,
  finishLocalRecording,
  isLocalMarkedReady,
  startLocalRecording,
  stopLocalRecording,
  subscribeLocalStt,
} from "@/lib/speech-local";
import { ensureLocalTts, isLocalTtsMarkedReady, subscribeLocalTts } from "@/lib/speech-local-tts";
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
    const ttsDecision = decideTtsEngine({
      webSpeechTts: "speechSynthesis" in window,
      webSpeechVoices: window.speechSynthesis?.getVoices?.().length ?? 0,
      ua: navigator.userAgent,
      pref: readSttPref(),
      localReady: isLocalTtsMarkedReady(),
    });
    setTtsAvailable(isTtsOutputAvailable());
    const canVoice = decision.engine !== "none" || decision.shouldPrefetch;
    setSttAvailable(canVoice);
    if (!canVoice) setMode("text");

    if (ttsDecision.shouldPrefetch) {
      setPackHint("正在给 Bella 装嘴巴…");
      void ensureLocalTts().then((ok) => {
        if (!isMounted.current) return;
        setTtsAvailable(ok || isTtsOutputAvailable());
        if (ok && !decision.shouldPrefetch) {
          setPackHint("离线嘴巴准备好了，可以听 Bella");
          setTimeout(() => {
            if (isMounted.current) setPackHint(null);
          }, 2500);
        } else if (!ok && !decision.shouldPrefetch) {
          setPackHint(null);
        }
      });
    }

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
          if (web) {
            setSttEngine("webspeech");
            setSttAvailable(true);
            setHint("离线包装不上，先用浏览器听。也可以打字。");
          } else {
            setSttAvailable(false);
            setMode("text");
            setHint("离线包装不上，请用文字输入");
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
    const unsubEar = subscribeLocalStt((s) => {
      if (s.status === "downloading" && s.progress > 0) {
        setPackHint(`正在给 Bella 装耳朵… ${s.progress}%`);
      } else if (s.status === "error") {
        setPackHint(null);
      }
    });
    const unsubMouth = subscribeLocalTts((s) => {
      if (s.status === "downloading" && s.progress > 0) {
        setPackHint(`正在给 Bella 装嘴巴… ${s.progress}%`);
      }
    });
    return () => {
      unsubEar();
      unsubMouth();
    };
  }, []);

  const showHint = useCallback((msg: string, ms = 3500) => {
    setHint(msg);
    setTimeout(() => {
      if (isMounted.current) setHint(null);
    }, ms);
  }, []);

  const playReply = useCallback(
    async (reply: string, afterMic: boolean) => {
      if (!reply.trim()) return;
      if (!ttsAvailable && !isTtsOutputAvailable()) return;

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
    <div className="w-full shrink-0 bg-white px-3 pb-1.5 pt-1.5">
      {(hint || packHint) && (
        <p className="mb-1 text-center text-sm text-amber-700 animate-fadeIn">{hint || packHint}</p>
      )}

      {interimText && (holding || listening) && (
        <p className="mb-1 break-words whitespace-pre-wrap px-2 text-center text-sm text-gray-600">{interimText}</p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={toggleMode}
          disabled={busy}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-pink-50 hover:text-pink-500 active:scale-95 disabled:opacity-40"
          aria-label={mode === "voice" ? "切换到键盘输入" : "切换到语音输入"}
        >
          {mode === "voice" ? <Keyboard className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        {mode === "voice" ? (
          <button
            ref={voiceBtnRef}
            type="button"
            aria-label="点击说话"
            onPointerDown={onVoicePressStart}
            onPointerUp={onVoicePressEnd}
            onPointerCancel={onVoicePressCancel}
            onContextMenu={(e) => e.preventDefault()}
            disabled={speaking || thinking}
            className={`
              flex h-14 min-h-14 flex-1 items-center justify-center rounded-full
              select-none touch-none transition-all
              ${
                holding
                  ? "scale-[0.98] border border-red-200 bg-red-50 text-red-500"
                  : listening
                    ? "animate-pulse border border-red-200 bg-red-50 text-red-500"
                    : thinking
                      ? "border border-amber-200 bg-amber-50 text-amber-600"
                      : speaking
                        ? "border border-green-200 bg-green-50 text-green-600"
                        : "border border-pink-100 bg-pink-50 text-pink-600 hover:bg-pink-100 active:scale-[0.98]"
              }
            `}
          >
            {holding || listening ? (
              <Mic className="h-8 w-8 animate-pulse" />
            ) : thinking ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : speaking ? (
              <Volume1 className="h-7 w-7 animate-pulse" />
            ) : (
              <Mic className="h-8 w-8" />
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
            className="h-14 min-h-14 flex-1 rounded-full border border-pink-100 bg-gray-50 px-4 text-base focus:border-pink-300 focus:bg-white focus:outline-none disabled:opacity-60"
          />
        )}

        {mode === "text" && (
          <button
            type="button"
            onClick={submitText}
            disabled={!textInput.trim() || thinking}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white transition-all hover:bg-pink-600 active:scale-95 disabled:opacity-40"
            aria-label="发送"
          >
            {thinking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
