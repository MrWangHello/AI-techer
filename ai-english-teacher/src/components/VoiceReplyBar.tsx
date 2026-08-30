"use client";

interface VoiceReplyBarProps {
  userText?: string;
  reply?: string;
  onDismiss?: () => void;
}

export default function VoiceReplyBar({ userText, reply, onDismiss }: VoiceReplyBarProps) {
  if (!reply && !userText) return null;

  return (
    <div className="mx-4 mb-2 bg-white/95 border border-pink-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm animate-fadeIn backdrop-blur-sm">
      {userText && (
        <div className="flex items-start gap-2 mb-1.5">
          <span className="text-sm text-gray-400 shrink-0">你</span>
          <p className="text-sm text-gray-600 flex-1">{userText}</p>
        </div>
      )}
      {reply && (
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0">💬</span>
          <p className="text-base text-gray-800 leading-relaxed flex-1">{reply}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-300 hover:text-gray-400 text-xs shrink-0"
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
