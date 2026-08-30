"use client";

import { useState } from "react";
import { Volume1, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { speak, speakEnglish, speakAuto, stopSpeaking, warmUpSpeech } from "@/lib/speech";
import type { SpeakIconLang } from "@/lib/speak-lang";

export default function SpeakableLine({
  text,
  speakText,
  lang = "auto",
  voiceSpeed = 1,
  pinyin,
  className,
  textClassName,
  pinyinClassName,
  align = "start",
  size = "line",
  children,
}: {
  text: string;
  speakText?: string;
  lang?: SpeakIconLang;
  voiceSpeed?: number;
  pinyin?: string;
  className?: string;
  textClassName?: string;
  pinyinClassName?: string;
  align?: "start" | "center";
  size?: "line" | "hero";
  children?: React.ReactNode;
}) {
  const [playing, setPlaying] = useState(false);
  const spoken = (speakText ?? text).trim();
  if (!spoken && !children) return null;

  const aria = `朗读 ${spoken.slice(0, 16)}`;

  const toggle = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    warmUpSpeech();
    stopSpeaking();
    setPlaying(true);
    const onEnd = () => setPlaying(false);
    const ok =
      lang === "en"
        ? speakEnglish(spoken, onEnd, voiceSpeed)
        : lang === "zh"
          ? speak(spoken, onEnd, voiceSpeed)
          : speakAuto(spoken, onEnd, voiceSpeed);
    if (!ok) setPlaying(false);
  };

  return (
    <button
      type="button"
      aria-label={aria}
      onClick={toggle}
      className={cn(
        "relative w-full rounded-xl px-2 py-1.5 transition-colors",
        align === "center" ? "text-center" : "text-left",
        size === "hero" && "py-3",
        playing ? "bg-pink-50" : "hover:bg-pink-50/80 active:bg-pink-100/70",
        className
      )}
    >
      <span className={cn("block min-w-0", textClassName)}>{children ?? text}</span>
      {pinyin && (
        <span className={cn("block mt-1 text-2xl font-medium text-pink-500", pinyinClassName)}>{pinyin}</span>
      )}
      <span
        className={cn(
          "pointer-events-none absolute top-1.5 right-1.5 text-pink-400",
          playing && "text-green-500"
        )}
        aria-hidden
      >
        {playing ? <Volume1 className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
      </span>
    </button>
  );
}
