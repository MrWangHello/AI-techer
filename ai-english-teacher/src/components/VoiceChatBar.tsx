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
  isSTTSupported,
  isSpeechSupported,
} from "@/lib/speech";
import { handleUserMessage, AgentResponse } from "@/lib/mock-agent";

export type InputMode = "voice" | "text";

interface VoiceChatBarProps {
  onAgentResponse: (response: AgentResponse) => void;
  onTranscript?: (text: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  voiceSpeed?: number;
}

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
  const isMounted = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const holdActive = useRef(false);

  const stopListeningUi = useCallback(() => {
    stopListening();
    if (isMounted.current) {
      setListening(false);
      setHolding(false);
      setInterimText("");
    }
    holdActive.current = false;
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const stt = isSTTSupported();
    setSttAvailable(stt);
    setTtsAvailable(isSpeechSupported());
    if (!stt) setMode("text");
    return () => {
      isMounted.current = false;
      try {
        stopListening();
      } catch (_) {}
      stopSpeaking();
    };
  }, []);

  const showHint = useCallback((msg: string, ms = 3000) => {
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

  /** 点按模式（备用） */
  const startTapVoice = useCallback(() => {
    if (thinking || speaking) return;
    if (!sttAvailable) {
      switchToText();
      showHint("语音识别不可用，已切换为文字输入");
      return;
    }
    if (listening) {
      stopListeningUi();
      return;
    }

    stopSpeaking();
    setListening(true);

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
        if (!soft) switchToText();
        showHint(soft ? `${err}（仍可继续用语音）` : `${err}，已切换文字输入`);
      },
      () => {
        if (!isMounted.current) return;
        setListening(false);
      }
    );
  }, [sttAvailable, listening, thinking, speaking, onTranscript, handleAgentReply, switchToText, showHint, stopListeningUi]);

  const beginHold = useCallback(() => {
    if (thinking || speaking || holdActive.current) return;
    if (!sttAvailable) {
      switchToText();
      return;
    }

    stopSpeaking();
    holdActive.current = true;
    setHolding(true);
    setListening(true);
    setInterimText("");

    startHoldListening(
      (text) => {
        if (isMounted.current) setInterimText(text);
      },
      (err) => {
        if (!isMounted.current) return;
        stopListeningUi();
        showHint(err);
      }
    );
  }, [thinking, speaking, sttAvailable, switchToText, showHint, stopListeningUi]);

  const finishHold = useCallback(() => {
    if (!holdActive.current) return;
    holdActive.current = false;
    setHolding(false);
    setListening(false);

    endHoldListening(
      (text) => {
        setInterimText("");
        onTranscript?.(text);
        void handleAgentReply(text, true);
      },
      () => {
        setInterimText("");
        showHint("没听到声音，请再试一次");
      }
    );
  }, [onTranscript, handleAgentReply, showHint]);

  const busy = listening || speaking || thinking;

  return (
    <div className="shrink-0 bg-white border-t border-pink-100 px-3 pt-2 pb-2">
      {hint && <p className="text-[10px] text-amber-600 text-center mb-1.5 animate-fadeIn">{hint}</p>}

      {interimText && holding && (
        <p className="text-[10px] text-gray-500 text-center mb-1 truncate">{interimText}</p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={toggleMode}
          disabled={busy}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 active:scale-95 transition-all disabled:opacity-40"
          aria-label={mode === "voice" ? "切换到键盘输入" : "切换到语音输入"}
        >
          {mode === "voice" ? <Keyboard className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {mode === "voice" ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              beginHold();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              finishHold();
            }}
            onPointerLeave={() => {
              if (holding) finishHold();
            }}
            onContextMenu={(e) => e.preventDefault()}
            disabled={speaking || thinking}
            className={`
              flex-1 h-10 rounded-full flex items-center justify-center gap-2
              text-sm font-medium transition-all select-none touch-none
              ${
                holding
                  ? "bg-red-50 text-red-500 border border-red-200 scale-[0.98]"
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
                <Mic className="w-4 h-4 animate-pulse" />
                松手发送...
              </>
            ) : thinking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Bella 在想...
              </>
            ) : speaking ? (
              <>
                <Volume1 className="w-4 h-4 animate-pulse" />
                Bella 正在说话...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                按住说话
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
            className="flex-1 h-10 px-4 text-sm bg-gray-50 border border-pink-100 rounded-full focus:outline-none focus:border-pink-300 focus:bg-white disabled:opacity-60"
          />
        )}

        {mode === "text" && (
          <button
            type="button"
            onClick={submitText}
            disabled={!textInput.trim() || thinking}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-40 active:scale-95 transition-all"
            aria-label="发送"
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        )}
      </div>
      <p className="text-[9px] text-center text-gray-300 mt-1">轻点键盘图标可切换文字输入</p>
    </div>
  );
}
