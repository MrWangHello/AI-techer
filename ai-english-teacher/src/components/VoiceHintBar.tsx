"use client";

interface VoiceHintBarProps {
  text: string;
  className?: string;
}

/** 模块语音指令引导条（醒目小字提示） */
export default function VoiceHintBar({ text, className = "" }: VoiceHintBarProps) {
  if (!text.trim()) return null;

  return (
    <div
      className={`rounded-xl bg-pink-50 border border-pink-100 px-3 py-2 ${className}`}
      role="note"
      aria-label="语音指令提示"
    >
      <p className="text-[11px] text-pink-700 leading-relaxed">
        <span className="font-medium text-pink-500">🎤 语音这样说：</span>
        {text}
      </p>
    </div>
  );
}
