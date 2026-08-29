"use client";

import { useState } from "react";
import { WORDS, Word } from "@/lib/words";
import { speakEnglish } from "@/lib/speech";
import { Volume2, Check, X } from "lucide-react";

interface StudyCardsProps {
  onWordLearned?: (word: Word) => void;
}

export default function StudyCards({ onWordLearned }: StudyCardsProps) {
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);

  const currentWord = WORDS[currentIndex];

  // 学习模式：朗读单词
  const speakWord = () => {
    speakEnglish(currentWord.en);
  };

  const speakSentence = () => {
    speakEnglish(currentWord.sentence);
  };

  const nextWord = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % WORDS.length);
  };

  const prevWord = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + WORDS.length) % WORDS.length);
  };

  // 测验模式：随机出题
  const startQuiz = () => {
    setMode("quiz");
    setQuizIndex(0);
    setScore(0);
    setQuizResult(null);
  };

  // 生成一个测验题
  const getQuizQuestion = () => {
    const correctWord = WORDS[quizIndex % WORDS.length];
    const wrongWords = WORDS.filter((w) => w.en !== correctWord.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [correctWord, ...wrongWords].sort(
      () => Math.random() - 0.5
    );
    return { correctWord, options };
  };

  const quiz = getQuizQuestion();

  const handleQuizAnswer = (word: Word) => {
    const isCorrect = word.en === quiz.correctWord.en;
    setQuizResult(isCorrect);
    if (isCorrect) {
      setScore((s) => s + 1);
      onWordLearned?.(word);
    }
    setTimeout(() => {
      setQuizResult(null);
      setQuizIndex((i) => i + 1);
    }, 1500);
  };

  // 回到学习模式
  const backToLearn = () => {
    setMode("learn");
    setShowAnswer(false);
  };

  if (mode === "quiz") {
    // 获取当前题目的中文
    const q = getQuizQuestion();
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700">📝 单词测验</h3>
          <span className="text-sm text-gray-400">
            得分: {score}/{quizIndex + 1}
          </span>
        </div>

        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-pink-600 mb-2">
            {q.correctWord.zh}
          </div>
          <div className="text-sm text-gray-400">请选择对应的英文</div>
        </div>

        {quizResult !== null && (
          <div
            className={`text-center py-2 rounded-lg mb-3 ${
              quizResult ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}
          >
            {quizResult ? "✅ 回答正确！" : `❌ 正确答案: ${q.correctWord.en}`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {q.options.map((word, i) => (
            <button
              key={i}
              onClick={() => handleQuizAnswer(word)}
              disabled={quizResult !== null}
              className={`
                py-3 px-4 rounded-xl font-medium text-sm
                transition-all duration-200
                ${
                  quizResult !== null
                    ? word.en === q.correctWord.en
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400"
                    : "bg-pink-50 hover:bg-pink-100 text-gray-700 active:scale-95"
                }
              `}
            >
              {word.en}
            </button>
          ))}
        </div>

        <button
          onClick={backToLearn}
          className="mt-4 w-full py-2 text-center text-sm text-gray-400 hover:text-gray-600"
        >
          返回学习模式
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700">📖 单词学习</h3>
        <button
          onClick={startQuiz}
          className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full hover:bg-pink-200"
        >
          开始测验
        </button>
      </div>

      {/* 单词卡片 */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 text-center mb-4">
        <div className="text-3xl font-bold text-gray-800 mb-1">
          {currentWord.en}
        </div>
        {showAnswer && (
          <div className="text-lg text-gray-500 mt-2 animate-fadeIn">
            {currentWord.zh}
          </div>
        )}
        {showAnswer && (
          <div className="text-sm text-gray-400 mt-2 italic">
            "{currentWord.sentence}"
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={speakWord}
          className="flex items-center gap-1.5 bg-pink-500 text-white px-4 py-2 rounded-full text-sm
            hover:bg-pink-600 active:scale-95 transition-all"
        >
          <Volume2 className="w-4 h-4" />
          朗读
        </button>
        <button
          onClick={speakSentence}
          className="flex items-center gap-1.5 bg-purple-500 text-white px-4 py-2 rounded-full text-sm
            hover:bg-purple-600 active:scale-95 transition-all"
        >
          <Volume2 className="w-4 h-4" />
          例句
        </button>
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex items-center gap-1.5 bg-gray-500 text-white px-4 py-2 rounded-full text-sm
            hover:bg-gray-600 active:scale-95 transition-all"
        >
          {showAnswer ? "隐藏" : "显示"}
        </button>
      </div>

      {/* 导航 */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevWord}
          className="text-gray-400 hover:text-pink-500 text-sm"
        >
          ← 上一个
        </button>
        <span className="text-xs text-gray-300">
          {currentIndex + 1} / {WORDS.length}
        </span>
        <button
          onClick={nextWord}
          className="text-gray-400 hover:text-pink-500 text-sm"
        >
          下一个 →
        </button>
      </div>
    </div>
  );
}