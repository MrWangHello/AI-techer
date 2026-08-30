"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Keyboard, Send, Volume1 } from "lucide-react";
import {
  startListening,
  stopListening,
  speak,
  warmUpSpeech,
  stopSpeaking,
  isSTTSupported,
  isSpeechSupported,
} from "@/lib/speech";
import { processUserInput, AgentResponse } from "@/lib/mock-agent";

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
  const [speaking, setSpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [sttAvailable, setSttAvailable] = useState(true);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const warmedUp = useRef(false);
  const isMounted = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const ensureWarmup = useCallback(() => {
    if (!warmedUp.current) warmedUp.current = warmUpSpeech();
  }, []);

  const handleAgentReply = useCallback(
    (text: string) => {
      const response = processUserInput(text);
      onAgentResponse(response);

      if (!ttsAvailable) return;

      setSpeaking(true);
      onSpeakingChange?.(true);
      const success = speak(
        response.reply,
        () => {
          if (!isMounted.current) return;
          setSpeaking(false);
          onSpeakingChange?.(false);
        },
        voiceSpeed
      );
      if (!success) {
        setSpeaking(false);
        onSpeakingChange?.(false);
      }
    },
    [onAgentResponse, onSpeakingChange, ttsAvailable, voiceSpeed]
  );

  const submitText = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput("");
    onTranscript?.(text);
    handleAgentReply(text);
  }, [textInput, onTranscript, handleAgentReply]);

  const switchToText = useCallback(() => {
    setMode("text");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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

  const startVoiceInput = useCallback(() => {
    if (!sttAvailable) {
      switchToText();
      showHint("语音识别不可用，已切换为文字输入");
      return;
    }
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }

    ensureWarmup();
    setListening(true);

    startListening(
      (text) => {
        if (!isMounted.current) return;
        setListening(false);
        onTranscript?.(text);
        handleAgentReply(text);
      },
      (err) => {
        if (!isMounted.current) return;
        setListening(false);
        switchToText();
        showHint(err.includes("权限") ? `${err}，已切换文字输入` : `${err}，请用文字输入`);
      }
    );
  }, [
    sttAvailable,
    listening,
    ensureWarmup,
    onTranscript,
    handleAgentReply,
    switchToText,
    showHint,
  ]);

  return (
    <div className="shrink-0 bg-white border-t border-pink-100 px-3 pt-2 pb-2">
      {hint && (
        <p className="text-[10px] text-amber-600 text-center mb-1.5 animate-fadeIn">{hint}</p>
      )}

      <div className="flex items-end gap-2">
        {/* 模式切换：语音 ↔ 键盘 */}
        <button
          type="button"
          onClick={toggleMode}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 active:scale-95 transition-all"
          aria-label={mode === "voice" ? "切换到键盘输入" : "切换到语音输入"}
        >
          {mode === "voice" ? (
            <Keyboard className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* 输入区 */}
        {mode === "voice" ? (
          <button
            type="button"
            onClick={startVoiceInput}
            disabled={speaking}
            className={`
              flex-1 h-10 rounded-full flex items-center justify-center gap-2
              text-sm font-medium transition-all active:scale-[0.98]
              ${
                listening
                  ? "bg-red-50 text-red-500 border border-red-200 animate-pulse"
                  : speaking
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100"
              }
            `}
          >
            {listening ? (
              <>
                <Mic className="w-4 h-4" />
                正在听...
              </>
            ) : speaking ? (
              <>
                <Volume1 className="w-4 h-4 animate-pulse" />
                Bella 正在说话...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                点击说话
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
            className="flex-1 h-10 px-4 text-sm bg-gray-50 border border-pink-100 rounded-full focus:outline-none focus:border-pink-300 focus:bg-white"
          />
        )}

        {/* 发送（文字模式） */}
        {mode === "text" && (
          <button
            type="button"
            onClick={submitText}
            disabled={!textInput.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-40 active:scale-95 transition-all"
            aria-label="发送"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
