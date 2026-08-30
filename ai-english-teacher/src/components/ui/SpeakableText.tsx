"use client";

import { cn } from "@/lib/cn";
import SpeakIcon from "@/components/ui/SpeakIcon";
import type { SpeakIconLang } from "@/lib/speak-lang";

export default function SpeakableText({
  text,
  speakText,
  lang = "auto",
  voiceSpeed = 1,
  className,
  textClassName,
  align = "start",
  children,
}: {
  text: string;
  speakText?: string;
  lang?: SpeakIconLang;
  voiceSpeed?: number;
  className?: string;
  textClassName?: string;
  align?: "start" | "center";
  children?: React.ReactNode;
}) {
  if (!text.trim() && !children) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "center" ? "justify-center" : "justify-start",
        className
      )}
    >
      <div className={cn("min-w-0", textClassName)}>{children ?? text}</div>
      <SpeakIcon text={speakText ?? text} lang={lang} voiceSpeed={voiceSpeed} />
    </div>
  );
}
