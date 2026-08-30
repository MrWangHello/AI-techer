"use client";

import type { MathQuestion } from "@/lib/math/generator";
import { renderEmojiCount } from "@/lib/math/generator";

interface MathDrillProps {
  question: MathQuestion;
  streak?: number;
  onAnswer?: (n: number) => void;
}

export default function MathDrill({ question, streak = 0, onAnswer }: MathDrillProps) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 shadow-sm">
      <div className="text-center mb-3">
        <span className="text-2xl">{question.emoji}</span>
        <p className="text-sm text-amber-800 mt-1 font-medium">{question.scenario}</p>
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
        <span className="text-pink-500">?</span>
      </div>

      <p className="text-center text-lg font-semibold text-gray-700 mb-4">
        {question.a} {question.op} {question.b} = ?
      </p>

      {streak > 0 && (
        <p className="text-center text-xs text-green-600 mb-3">🔥 连对 {streak} 题！</p>
      )}

      <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onAnswer?.(n)}
            className="h-10 rounded-xl bg-white border border-amber-200 text-lg font-bold text-gray-700 hover:bg-amber-100 active:scale-95 transition-all"
          >
            {n}
          </button>
        ))}
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-3">点数字作答，或语音说出答案</p>
    </div>
  );
}
