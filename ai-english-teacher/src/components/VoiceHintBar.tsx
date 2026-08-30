"use client";

import SpeakableText from "@/components/ui/SpeakableText";

interface VoiceHintBarProps {
  text: string;
  className?: string;
  voiceSpeed?: number;
}

/** 模块语音指令引导条 */
export default function VoiceHintBar({ text, className = "", voiceSpeed = 1 }: VoiceHintBarProps) {
  if (!text.trim()) return null;

  const spoken = `可以这样说：${text}`;

  return (
    <div
      className={`rounded-xl bg-pink-50 border border-pink-100 px-3 py-2.5 ${className}`}
      role="note"
      aria-label="语音指令提示"
    >
      <SpeakableText
        text={spoken}
        lang="zh"
        voiceSpeed={voiceSpeed}
        className="items-start"
        textClassName="text-base text-pink-800 leading-relaxed"
      >
        <span className="font-semibold text-pink-500">可以这样说：</span>
        {text}
      </SpeakableText>
    </div>
  );
}
