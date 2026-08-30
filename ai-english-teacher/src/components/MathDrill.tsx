"use client";

import { useState, useEffect } from "react";
import type { MathQuestion } from "@/lib/math/generator";
import { renderEmojiCount } from "@/lib/math/generator";
import SpeakableLine from "@/components/ui/SpeakableLine";

interface MathDrillProps {
  question: MathQuestion;
  streak?: number;
  onAnswer?: (n: number) => void;
  voiceSpeed?: number;
}

export default function MathDrill({ question, streak = 0, onAnswer, voiceSpeed = 1 }: MathDrillProps) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const [input, setInput] = useState("");

  useEffect(() => {
    setInput("");
  }, [question.a, question.b, question.op]);

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

  const exprSpeak = `${question.a} ${question.op === "+" ? "加" : "减"} ${question.b} 等于多少`;

  return (
    <div
      className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm"
      onPointerDown={stopBubble}
      onClick={stopBubble}
    >
      <div className="mb-2 text-center">
        <span className="text-3xl">{question.emoji}</span>
        <SpeakableLine
          text={question.scenario}
          lang="zh"
          voiceSpeed={voiceSpeed}
          align="center"
          className="mt-1"
          textClassName="text-base text-amber-800 font-medium"
        />
      </div>

      <div className="mb-2 flex items-center justify-center gap-2 text-3xl font-bold text-gray-800">
        <span>{renderEmojiCount(question.a, question.emoji)}</span>
        {question.op === "+" ? <span className="text-amber-600">+</span> : <span className="text-rose-500">−</span>}
        <span>{renderEmojiCount(question.b, question.emoji)}</span>
        <span className="text-gray-400">=</span>
        <span className="text-pink-500">{input || "?"}</span>
      </div>

      <SpeakableLine
        text={exprSpeak}
        lang="zh"
        voiceSpeed={voiceSpeed}
        align="center"
        className="mb-3"
        textClassName="text-xl font-semibold text-gray-700"
      >
        {question.a} {question.op} {question.b} = ?
      </SpeakableLine>

      {streak > 0 && <p className="mb-3 text-center text-base text-green-600">连对 {streak} 题！</p>}

      <div className="mx-auto grid max-w-xs grid-cols-5 gap-2">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => appendDigit(n)}
            className="h-12 rounded-xl border border-amber-200 bg-white text-xl font-bold text-gray-700 transition-all hover:bg-amber-100 active:scale-95"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-3 flex max-w-xs gap-2">
        <button
          type="button"
          onClick={() => setInput("")}
          className="min-h-12 flex-1 rounded-xl border border-gray-200 bg-white text-base text-gray-600 active:scale-95"
        >
          清除
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!input}
          className="min-h-12 flex-1 rounded-xl bg-pink-500 text-base font-medium text-white active:scale-95 disabled:opacity-40"
        >
          确定
        </button>
      </div>
    </div>
  );
}
