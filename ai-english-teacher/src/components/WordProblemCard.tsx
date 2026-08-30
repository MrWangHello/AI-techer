"use client";

import { useState, useEffect } from "react";
import type { WordProblemItem } from "@/lib/providers/chinese-content";
import SpeakAloudButton from "@/components/SpeakAloudButton";

interface WordProblemCardProps {
  item: WordProblemItem;
  voiceSpeed?: number;
  onAnswer?: (n: number) => void;
}

export default function WordProblemCard({ item, voiceSpeed = 1, onAnswer }: WordProblemCardProps) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const [input, setInput] = useState("");

  useEffect(() => {
    setInput("");
  }, [item.question]);

  const appendDigit = (n: number) => {
    setInput((prev) => (prev.length < 2 ? prev + String(n) : prev));
  };

  const stopBubble = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const submit = () => {
    if (!input) return;
    const n = parseInt(input, 10);
    if (!Number.isNaN(n)) {
      onAnswer?.(n);
      setInput("");
    }
  };

  return (
    <div
      className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm"
      onPointerDown={stopBubble}
      onClick={stopBubble}
    >
      <div className="text-3xl text-center mb-2">{item.emoji}</div>
      <p className="text-sm text-gray-800 leading-relaxed text-center">{item.question}</p>

      <div className="flex justify-center my-3">
        <SpeakAloudButton text={item.question} voiceSpeed={voiceSpeed} />
      </div>

      <p className="text-center text-2xl font-bold text-pink-500 mb-3">{input || "?"}</p>

      <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => appendDigit(n)}
            className="h-10 rounded-xl bg-green-50 border border-green-200 text-lg font-bold text-gray-700 hover:bg-green-100 active:scale-95 transition-all"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-2 max-w-xs mx-auto mt-2">
        <button
          type="button"
          onClick={() => setInput("")}
          className="flex-1 h-9 rounded-xl bg-white border border-gray-200 text-xs text-gray-500 active:scale-95"
        >
          清除
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!input}
          className="flex-1 h-9 rounded-xl bg-green-500 text-white text-sm font-medium disabled:opacity-40 active:scale-95"
        >
          确定
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-3">
        点数字拼答案后点确定 · 语音直接说「8」或「答案是8」
      </p>
    </div>
  );
}
