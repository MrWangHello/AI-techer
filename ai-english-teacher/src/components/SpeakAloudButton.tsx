"use client";

import SpeakIcon from "@/components/ui/SpeakIcon";
import type { SpeakIconLang } from "@/lib/speak-lang";
import { cn } from "@/lib/cn";

interface SpeakAloudButtonProps {
  text: string;
  label?: string;
  voiceSpeed?: number;
  lang?: SpeakIconLang;
  className?: string;
}

export default function SpeakAloudButton({
  text,
  label = "朗读全部",
  voiceSpeed = 1,
  lang = "auto",
  className = "",
}: SpeakAloudButtonProps) {
  if (!text.trim()) return null;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <SpeakIcon text={text} lang={lang} voiceSpeed={voiceSpeed} label={label} />
      <span className="text-sm font-medium text-pink-600">{label}</span>
    </div>
  );
}
