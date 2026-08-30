"use client";

import SpeakableLine from "@/components/ui/SpeakableLine";
import type { SpeakIconLang } from "@/lib/speak-lang";

/** 兼容旧调用：整行可点读，小喇叭只做提示。 */
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
  return (
    <SpeakableLine
      text={text}
      speakText={speakText}
      lang={lang}
      voiceSpeed={voiceSpeed}
      className={className}
      textClassName={textClassName}
      align={align}
    >
      {children}
    </SpeakableLine>
  );
}
