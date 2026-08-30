"use client";

import SpeakIcon from "@/components/ui/SpeakIcon";

interface VoiceReplyBarProps {
  userText?: string;
  reply?: string;
  onDismiss?: () => void;
  voiceSpeed?: number;
}

export default function VoiceReplyBar({ userText, reply, onDismiss, voiceSpeed = 1 }: VoiceReplyBarProps) {
  if (!reply && !userText) return null;

  return (
    <div className="mx-auto w-full max-w-lg mb-2 bg-white/95 border border-pink-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm animate-fadeIn backdrop-blur-sm">
      {userText && (
        <div className="flex items-start gap-2 mb-2">
          <span className="text-base text-gray-400 shrink-0">你</span>
          <p className="text-base text-gray-600 flex-1">{userText}</p>
          <SpeakIcon text={userText} lang="auto" voiceSpeed={voiceSpeed} label="朗读我说的话" />
        </div>
      )}
      {reply && (
        <div className="flex items-start gap-2">
          <span className="text-base shrink-0">💬</span>
          <p className="text-base text-gray-800 leading-relaxed flex-1">{reply}</p>
          <SpeakIcon text={reply} lang="auto" voiceSpeed={voiceSpeed} label="朗读 Bella 的话" />
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 text-base shrink-0 w-10 h-10"
              aria-label="关闭"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
