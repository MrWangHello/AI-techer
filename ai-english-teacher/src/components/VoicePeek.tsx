"use client";

import { useEffect, useRef, useState } from "react";
import SpeakableLine from "@/components/ui/SpeakableLine";

export default function VoicePeek({
  userText,
  reply,
  voiceSpeed = 1,
  compact = false,
  onDismiss,
}: {
  userText?: string;
  reply?: string;
  voiceSpeed?: number;
  /** 课卡已有全文时不自动展开，避免和课文叠两遍 */
  compact?: boolean;
  onDismiss?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const prevReply = useRef("");

  useEffect(() => {
    if (reply && reply !== prevReply.current) {
      setOpen(!compact);
    }
    prevReply.current = reply ?? "";
  }, [reply, compact]);

  if (!reply && !userText) return null;

  const snippetSource = (userText || reply || "").replace(/\s+/g, " ").trim();
  const snippet = snippetSource.slice(0, 3);

  const closeSheet = () => setOpen(false);
  const dismissAll = () => {
    setOpen(false);
    onDismiss?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-2 z-20 flex max-w-[7.5rem] items-center gap-1 rounded-full border border-pink-100 bg-white/95 px-2.5 py-1.5 text-sm text-gray-600 shadow-sm backdrop-blur-sm"
        style={{ bottom: "0.5rem" }}
        aria-label="打开对话"
      >
        <span aria-hidden>💬</span>
        {userText ? <span>你</span> : <span>Bella</span>}
        <span className="min-w-0 truncate">{snippet}…</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 max-w-lg mx-auto">
          <button type="button" className="absolute inset-0 bg-black/25" aria-label="关闭对话" onClick={closeSheet} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[50vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-6 pt-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">对话</p>
              <button type="button" onClick={dismissAll} className="min-h-10 min-w-10 text-gray-400" aria-label="关闭">
                ✕
              </button>
            </div>
            {userText && (
              <SpeakableLine
                text={userText}
                lang="auto"
                voiceSpeed={voiceSpeed}
                className="mb-2"
                textClassName="text-base text-gray-600"
              >
                <span className="mr-1 text-gray-400">你</span>
                {userText}
              </SpeakableLine>
            )}
            {reply && (
              <SpeakableLine
                text={reply}
                lang="auto"
                voiceSpeed={voiceSpeed}
                textClassName="text-base text-gray-800 leading-relaxed"
              >
                <span className="mr-1">💬</span>
                {reply}
              </SpeakableLine>
            )}
          </div>
        </div>
      )}
    </>
  );
}
