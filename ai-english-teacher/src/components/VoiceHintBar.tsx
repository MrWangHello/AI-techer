"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import SpeakableLine from "@/components/ui/SpeakableLine";

interface VoiceHintBarProps {
  text: string;
  className?: string;
  voiceSpeed?: number;
}

/** 默认只露小问号，点开才看出「可以这样说」。 */
export default function VoiceHintBar({ text, className = "", voiceSpeed = 1 }: VoiceHintBarProps) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;

  const spoken = `可以这样说：${text}`;

  return (
    <div className={`relative flex justify-end ${className}`} role="note" aria-label="语音指令提示">
      <button
        type="button"
        aria-label="可以这样说"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-pink-400 hover:bg-pink-50 hover:text-pink-600"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-10 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-pink-100 bg-white p-2 shadow-md">
          <SpeakableLine
            text={spoken}
            lang="zh"
            voiceSpeed={voiceSpeed}
            textClassName="text-sm text-pink-800 leading-relaxed"
          >
            <span className="font-semibold text-pink-500">可以这样说：</span>
            {text}
          </SpeakableLine>
        </div>
      )}
    </div>
  );
}
