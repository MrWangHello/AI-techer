"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, MicOff, Volume2, Volume1 } from "lucide-react";
import { startListening, stopListening, getIsListening, speak, warmUpSpeech } from "@/lib/speech";
import { processUserInput, AgentResponse } from "@/lib/mock-agent";

interface VoiceControllerProps {
  onAgentResponse: (response: AgentResponse) => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}

export default function VoiceController({
  onAgentResponse,
  onTranscript,
  disabled = false,
  onSpeakingChange,
}: VoiceControllerProps) {
  const [listening, setListening] = useState(false);
  const [statusText, setStatusText] = useState("点击麦克风说话");
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const warmedUp = useRef(false);

  // 预热语音引擎
  const ensureWarmup = useCallback(() => {
    if (!warmedUp.current) {
      warmedUp.current = warmUpSpeech();
      if (warmedUp.current) {
        console.log("[VoiceController] Speech warmed up successfully");
      }
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (disabled) return;

    if (listening) {
      stopListening();
      setListening(false);
      setStatusText("点击麦克风说话");
      return;
    }

    // 预热语音引擎
    ensureWarmup();

    setError(null);
    setStatusText("正在听...");
    setListening(true);

    startListening(
      // onResult
      (text) => {
        setListening(false);
        setStatusText(`你说: "${text}"`);
        onTranscript?.(text);

        // 处理 AI Agent 回复
        const response = processUserInput(text);
        onAgentResponse(response);

        // TTS 播报回复
        setSpeaking(true);
        onSpeakingChange?.(true);
        const success = speak(response.reply, () => {
          setSpeaking(false);
          onSpeakingChange?.(false);
          setStatusText("点击麦克风说话");
        });
        if (!success) {
          setSpeaking(false);
          onSpeakingChange?.(false);
          setError("语音合成失败，请检查浏览器是否支持");
          setStatusText("点击麦克风说话");
          setTimeout(() => setError(null), 3000);
        }
      },
      // onError
      (err) => {
        setListening(false);
        setStatusText("点击麦克风说话");
        setError(err);
        setTimeout(() => setError(null), 3000);
      }
    );
  }, [listening, disabled, onAgentResponse, onTranscript, ensureWarmup]);

  return (
    <div className="flex flex-col items-center gap-2">
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
      <span className="text-xs text-gray-400">{statusText}</span>
      {error && (
        <span className="text-xs text-red-500 animate-fadeIn">{error}</span>
      )}
      {speaking && (
        <span className="text-xs text-green-500 animate-fadeIn">🔊 正在朗读...</span>
      )}
    </div>
  );
}