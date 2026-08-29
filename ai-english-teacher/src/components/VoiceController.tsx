"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { startListening, stopListening, getIsListening, speak } from "@/lib/speech";
import { processUserInput, AgentResponse } from "@/lib/mock-agent";

interface VoiceControllerProps {
  onAgentResponse: (response: AgentResponse) => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceController({
  onAgentResponse,
  onTranscript,
  disabled = false,
}: VoiceControllerProps) {
  const [listening, setListening] = useState(false);
  const [statusText, setStatusText] = useState("点击麦克风说话");
  const [error, setError] = useState<string | null>(null);

  const toggleMic = useCallback(() => {
    if (disabled) return;

    if (listening) {
      stopListening();
      setListening(false);
      setStatusText("点击麦克风说话");
      return;
    }

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

        // TTS 播报
        speak(response.reply, () => {
          setStatusText("点击麦克风说话");
        });
      },
      // onError
      (err) => {
        setListening(false);
        setStatusText("点击麦克风说话");
        setError(err);
        setTimeout(() => setError(null), 3000);
      }
    );
  }, [listening, disabled, onAgentResponse, onTranscript]);

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
              : "bg-pink-500 hover:bg-pink-600 shadow-pink-200"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {listening ? (
          <MicOff className="w-7 h-7 text-white" />
        ) : (
          <Mic className="w-7 h-7 text-white" />
        )}
      </button>
      <span className="text-xs text-gray-400">{statusText}</span>
      {error && (
        <span className="text-xs text-red-500 animate-fadeIn">{error}</span>
      )}
    </div>
  );
}