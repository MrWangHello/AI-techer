"use client";

import { Volume2 } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/speech";

interface SpeakAloudButtonProps {
  text: string;
  label?: string;
  voiceSpeed?: number;
  className?: string;
}

export default function SpeakAloudButton({
  text,
  label = "朗读",
  voiceSpeed = 1,
  className = "",
}: SpeakAloudButtonProps) {
  if (!text.trim()) return null;

  const onSpeak = () => {
    stopSpeaking();
    speak(text, undefined, voiceSpeed);
  };

  return (
    <button
      type="button"
      onClick={onSpeak}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-medium active:scale-95 transition-all ${className}`}
      aria-label={label}
    >
      <Volume2 className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
