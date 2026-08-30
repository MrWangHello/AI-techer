"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Volume1, Send } from "lucide-react";
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

interface VoiceControllerProps {
  onAgentResponse: (response: AgentResponse) => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
  voiceSpeed?: number;
}

export default function VoiceController({
  onAgentResponse,
  onTranscript,
  disabled = false,
  onSpeakingChange,
  voiceSpeed = 1.0,
}: VoiceControllerProps) {
  const [listening, setListening] = useState(false);
  const [statusText, setStatusText] = useState("点击麦克风说话");
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const warmedUp = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setSttSupported(isSTTSupported());
    setTtsSupported(isSpeechSupported());
    if (!isSTTSupported()) {
      setStatusText("语音识别不可用，请用文字输入");
    }
    return () => {
      isMounted.current = false;
      try {
        stopListening();
      } catch (_) {}
      stopSpeaking();
    };
  }, []);

  const safeSetListening = useCallback((v: boolean) => {
    if (isMounted.current) setListening(v);
  }, []);
  const safeSetStatusText = useCallback((v: string) => {
    if (isMounted.current) setStatusText(v);
  }, []);
  const safeSetSpeaking = useCallback((v: boolean) => {
    if (isMounted.current) setSpeaking(v);
  }, []);
  const safeSetError = useCallback((v: string | null) => {
    if (isMounted.current) setError(v);
  }, []);

  const ensureWarmup = useCallback(() => {
    if (!warmedUp.current) {
      warmedUp.current = warmUpSpeech();
    }
  }, []);

  const handleAgentReply = useCallback(
    (text: string) => {
      const response = processUserInput(text);
      onAgentResponse(response);

      if (!ttsSupported) {
        safeSetError("当前浏览器不支持语音朗读，建议使用 Chrome");
        setTimeout(() => safeSetError(null), 3000);
        return;
      }

      safeSetSpeaking(true);
      onSpeakingChange?.(true);
      const success = speak(
        response.reply,
        () => {
          if (!isMounted.current) return;
          safeSetSpeaking(false);
          onSpeakingChange?.(false);
          safeSetStatusText(sttSupported ? "点击麦克风说话" : "输入文字与 Bella 对话");
        },
        voiceSpeed
      );
      if (!success) {
        safeSetSpeaking(false);
        onSpeakingChange?.(false);
        safeSetError("语音合成失败，请检查浏览器是否支持");
        safeSetStatusText(sttSupported ? "点击麦克风说话" : "输入文字与 Bella 对话");
        setTimeout(() => safeSetError(null), 3000);
      }
    },
    [
      onAgentResponse,
      onSpeakingChange,
      safeSetSpeaking,
      safeSetStatusText,
      safeSetError,
      ttsSupported,
      sttSupported,
      voiceSpeed,
    ]
  );

  const submitTextInput = useCallback(() => {
    const text = textInput.trim();
    if (!text || disabled) return;
    setTextInput("");
    onTranscript?.(text);
    handleAgentReply(text);
  }, [textInput, disabled, onTranscript, handleAgentReply]);

  const toggleMic = useCallback(() => {
    if (disabled || !sttSupported) return;

    if (listening) {
      stopListening();
      setListening(false);
      setStatusText("点击麦克风说话");
      return;
    }

    ensureWarmup();
    setError(null);
    setStatusText("正在听...");
    setListening(true);

    startListening(
      (text) => {
        if (!isMounted.current) return;
        safeSetListening(false);
        safeSetStatusText(`你说: "${text}"`);
        onTranscript?.(text);
        handleAgentReply(text);
      },
      (err) => {
        if (!isMounted.current) return;
        safeSetListening(false);
        safeSetStatusText("点击麦克风说话");
        safeSetError(err);
        setTimeout(() => safeSetError(null), 3000);
      }
    );
  }, [
    listening,
    disabled,
    sttSupported,
    ensureWarmup,
    onTranscript,
    handleAgentReply,
    safeSetListening,
    safeSetStatusText,
    safeSetError,
  ]);

  return (
    <div className="flex flex-col items-center gap-2">
      {sttSupported ? (
        <button
          onClick={toggleMic}
          disabled={disabled}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-lg
            ${
              listening
                ? "bg-red-500 scale-110 shadow-red-300 animate-pulse"
                : speaking
                ? "bg-green-500 scale-105 shadow-green-300"
                : "bg-pink-500 hover:bg-pink-600 shadow-pink-200"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {listening ? (
            <MicOff className="w-7 h-7 text-white" />
          ) : speaking ? (
            <Volume1 className="w-7 h-7 text-white animate-pulse" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
        </button>
      ) : (
        <div className="w-full max-w-xs flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTextInput()}
            placeholder="输入文字与 Bella 对话..."
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm border border-pink-200 rounded-xl focus:outline-none focus:border-pink-400"
          />
          <button
            onClick={submitTextInput}
            disabled={disabled || !textInput.trim()}
            className="w-10 h-10 bg-pink-500 text-white rounded-xl flex items-center justify-center hover:bg-pink-600 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      <span className="text-xs text-gray-400">{statusText}</span>
      {error && (
        <span className="text-xs text-red-500 animate-fadeIn">{error}</span>
      )}
      {speaking && (
        <span className="text-xs text-green-500 animate-fadeIn">🔊 正在朗读...</span>
      )}
      {!ttsSupported && (
        <span className="text-xs text-amber-500">朗读不可用，建议使用 Chrome 浏览器</span>
      )}
    </div>
  );
}
