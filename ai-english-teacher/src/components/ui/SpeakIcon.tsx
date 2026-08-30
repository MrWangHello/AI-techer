"use client";

import { useState } from "react";
import { Volume1, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { speak, speakEnglish, speakAuto, stopSpeaking, warmUpSpeech } from "@/lib/speech";
import type { SpeakIconLang } from "@/lib/speak-lang";

export type { SpeakIconLang };

export default function SpeakIcon({
  text,
  lang = "auto",
  voiceSpeed = 1,
  label,
  className,
  size = "md",
}: {
  text: string;
  lang?: SpeakIconLang;
  voiceSpeed?: number;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [playing, setPlaying] = useState(false);
  const trimmed = text.trim();
  if (!trimmed) return null;

  const aria = label ?? `朗读 ${trimmed.slice(0, 16)}`;
  const compact = size === "sm";

  const start = () => {
    warmUpSpeech();
    stopSpeaking();
    setPlaying(true);
    const onEnd = () => setPlaying(false);
    const ok =
      lang === "en"
        ? speakEnglish(trimmed, onEnd, voiceSpeed)
        : lang === "zh"
          ? speak(trimmed, onEnd, voiceSpeed)
          : speakAuto(trimmed, onEnd, voiceSpeed);
    if (!ok) setPlaying(false);
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    start();
  };

  return (
    <button
      type="button"
      aria-label={aria}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center shrink-0 rounded-full transition-all",
        compact
          ? "h-7 w-7 min-h-7 min-w-7 text-pink-500 hover:bg-pink-50"
          : "h-12 w-12 min-h-12 min-w-12 bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100",
        "active:scale-95",
        playing && (compact ? "text-green-600" : "bg-green-50 text-green-600 border-green-200"),
        className
      )}
    >
      {playing ? (
        <Volume1 className={cn(compact ? "h-4 w-4" : "h-6 w-6", "animate-pulse")} />
      ) : (
        <Volume2 className={compact ? "h-4 w-4" : "h-6 w-6"} />
      )}
    </button>
  );
}
