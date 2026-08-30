"use client";

import { useState, useEffect } from "react";
import type { MathQuestion } from "@/lib/math/generator";
import { renderEmojiCount } from "@/lib/math/generator";
import SpeakableText from "@/components/ui/SpeakableText";

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
      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 shadow-sm"
      onPointerDown={stopBubble}
      onClick={stopBubble}
    >
      <div className="text-center mb-3">
        <span className="text-3xl">{question.emoji}</span>
        <SpeakableText
          text={question.scenario}
          lang="zh"
          voiceSpeed={voiceSpeed}
          align="center"
          className="mt-2"
          textClassName="text-base text-amber-800 font-medium"
        />
      </div>

      <div className="flex justify-center items-center gap-2 text-3xl font-bold text-gray-800 mb-2">
        <span>{renderEmojiCount(question.a, question.emoji)}</span>
        {question.op === "+" ? (
          <span className="text-amber-600">+</span>
        ) : (
          <span className="text-rose-500">−</span>
        )}
        <span>{renderEmojiCount(question.b, question.emoji)}</span>
        <span className="text-gray-400">=</span>
        <span className="text-pink-500">{input || "?"}</span>
      </div>

      <SpeakableText
        text={exprSpeak}
        lang="zh"
        voiceSpeed={voiceSpeed}
        align="center"
        className="mb-3"
        textClassName="text-xl font-semibold text-gray-700"
      >
        {question.a} {question.op} {question.b} = ?
      </SpeakableText>

      {streak > 0 && (
        <p className="text-center text-base text-green-600 mb-3">连对 {streak} 题！</p>
      )}

      <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => appendDigit(n)}
            className="h-12 rounded-xl bg-white border border-amber-200 text-xl font-bold text-gray-700 hover:bg-amber-100 active:scale-95 transition-all"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-2 max-w-xs mx-auto mt-3">
        <button
          type="button"
          onClick={() => setInput("")}
          className="flex-1 min-h-12 rounded-xl bg-white border border-gray-200 text-base text-gray-600 active:scale-95"
        >
          清除
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!input}
          className="flex-1 min-h-12 rounded-xl bg-pink-500 text-white text-base font-medium disabled:opacity-40 active:scale-95"
        >
          确定
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-3">点数字拼答案后点确定 · 也可以直接说「8」</p>
    </div>
  );
}
