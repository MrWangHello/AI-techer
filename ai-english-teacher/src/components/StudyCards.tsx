"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Word, loadWordBatch, refreshWordBatch } from "@/lib/words";
import { warmUpSpeech } from "@/lib/speech";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import SpeakIcon from "@/components/ui/SpeakIcon";
import SpeakableLine from "@/components/ui/SpeakableLine";

interface StudyCardsProps {
  words?: Word[];
  voiceSpeed?: number;
  onWordLearned?: (word: Word) => void;
  onQuizResult?: (correct: boolean) => void;
}

export default function StudyCards({
  words: wordsProp,
  voiceSpeed = 1,
  onWordLearned,
  onQuizResult,
}: StudyCardsProps) {
  const [words, setWords] = useState<Word[]>(() => wordsProp ?? loadWordBatch());
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const warmedUp = useRef(false);

  useEffect(() => {
    if (wordsProp) {
      setWords(wordsProp);
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  }, [wordsProp]);

  const ensureWarmup = useCallback(() => {
    if (!warmedUp.current) {
      warmedUp.current = warmUpSpeech();
    }
  }, []);

  const handleRefreshBatch = () => {
    const batch = refreshWordBatch();
    setWords(batch);
    setCurrentIndex(0);
    setShowAnswer(false);
    setMode("learn");
  };

  const currentWord = words[currentIndex] ?? words[0];

  const nextWord = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const prevWord = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  const startQuiz = () => {
    ensureWarmup();
    setMode("quiz");
    setQuizIndex(0);
    setScore(0);
    setQuizResult(null);
  };

  const getQuizQuestion = () => {
    const correctWord = words[quizIndex % words.length];
    const wrongWords = words.filter((w) => w.en !== correctWord.en).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correctWord, ...wrongWords].sort(() => Math.random() - 0.5);
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
    onQuizResult?.(isCorrect);
    setTimeout(() => {
      setQuizResult(null);
      setQuizIndex((i) => i + 1);
    }, 1500);
  };

  const backToLearn = () => {
    setMode("learn");
    setShowAnswer(false);
  };

  if (!currentWord) {
    return <div className="rounded-2xl bg-white/80 p-5 text-center text-base text-gray-500">词库加载中…</div>;
  }

  if (mode === "quiz") {
    return (
      <div className="rounded-2xl border border-pink-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-700">单词测验</h3>
          <span className="text-base text-gray-500">
            得分: {score}/{quizIndex + 1}
          </span>
        </div>

        <SpeakableLine
          text={quiz.correctWord.zh}
          lang="zh"
          voiceSpeed={voiceSpeed}
          align="center"
          className="mb-2"
          textClassName="text-3xl font-bold text-pink-600"
        />
        <p className="mb-4 text-center text-base text-gray-500">请选择对应的英文</p>

        {quizResult !== null && (
          <div
            className={`mb-3 rounded-lg py-2 text-center text-base ${
              quizResult ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}
          >
            {quizResult ? "回答正确！" : `正确答案: ${quiz.correctWord.en}`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {quiz.options.map((word, i) => (
            <div key={`${word.en}-${i}`} className="relative">
              <button
                type="button"
                onClick={() => handleQuizAnswer(word)}
                disabled={quizResult !== null}
                className={`
                  min-h-12 w-full rounded-xl px-3 py-3 pr-8 text-base font-medium transition-all duration-200
                  ${
                    quizResult !== null
                      ? word.en === quiz.correctWord.en
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                      : "bg-pink-50 text-gray-700 hover:bg-pink-100 active:scale-95"
                  }
                `}
              >
                {word.en}
              </button>
              <SpeakIcon
                size="sm"
                text={word.en}
                lang="en"
                voiceSpeed={voiceSpeed}
                label={`朗读 ${word.en}`}
                className="absolute top-1 right-1"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={backToLearn}
          className="mt-4 min-h-11 w-full py-2 text-center text-base text-gray-500 hover:text-gray-700"
        >
          返回学习模式
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-700">单词学习</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRefreshBatch}
            className="flex min-h-10 items-center gap-1 rounded-full bg-purple-100 px-3 text-sm text-purple-600 hover:bg-purple-200"
          >
            <RefreshCw className="h-4 w-4" />
            换一批
          </button>
          <button
            type="button"
            onClick={startQuiz}
            className="min-h-10 rounded-full bg-pink-100 px-3 text-sm text-pink-600 hover:bg-pink-200"
          >
            开始测验
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-2 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 p-5 text-center">
        <SpeakableLine
          text={currentWord.en}
          lang="en"
          voiceSpeed={voiceSpeed}
          align="center"
          size="hero"
          textClassName="text-4xl font-bold text-gray-800"
        />
        {showAnswer && (
          <SpeakableLine
            text={currentWord.zh}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            className="animate-fadeIn"
            textClassName="text-xl text-gray-600"
          />
        )}
        {showAnswer && (
          <SpeakableLine
            text={currentWord.sentence}
            lang="en"
            voiceSpeed={voiceSpeed}
            align="center"
            className="animate-fadeIn"
            textClassName="text-base text-gray-500 italic"
          >
            “{currentWord.sentence}”
          </SpeakableLine>
        )}
      </div>

      <div className="mb-3 flex justify-center">
        <button
          type="button"
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-gray-500 px-4 text-sm text-white hover:bg-gray-600 active:scale-95"
        >
          {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showAnswer ? "隐藏意思" : "显示意思"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={prevWord} className="min-h-11 px-2 text-sm text-gray-500 hover:text-pink-500">
          ← 上一个
        </button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {words.length}
        </span>
        <button type="button" onClick={nextWord} className="min-h-11 px-2 text-sm text-gray-500 hover:text-pink-500">
          下一个 →
        </button>
      </div>
    </div>
  );
}
