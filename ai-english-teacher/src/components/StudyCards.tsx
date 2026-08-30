"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Word, loadWordBatch, refreshWordBatch } from "@/lib/words";
import { warmUpSpeech } from "@/lib/speech";
import { RefreshCw } from "lucide-react";
import SpeakIcon from "@/components/ui/SpeakIcon";
import SpeakableText from "@/components/ui/SpeakableText";

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
    return (
      <div className="bg-white/80 rounded-2xl p-5 text-center text-base text-gray-500">
        词库加载中…
      </div>
    );
  }

  if (mode === "quiz") {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-700">单词测验</h3>
          <span className="text-base text-gray-500">
            得分: {score}/{quizIndex + 1}
          </span>
        </div>

        <SpeakableText
          text={quiz.correctWord.zh}
          lang="zh"
          voiceSpeed={voiceSpeed}
          align="center"
          className="mb-2"
          textClassName="text-3xl font-bold text-pink-600"
        />
        <p className="text-base text-gray-500 text-center mb-4">请选择对应的英文</p>

        {quizResult !== null && (
          <div
            className={`text-center py-2 rounded-lg mb-3 text-base ${
              quizResult ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}
          >
            {quizResult ? "回答正确！" : `正确答案: ${quiz.correctWord.en}`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {quiz.options.map((word, i) => (
            <div key={`${word.en}-${i}`} className="flex items-center gap-1">
              <button
                onClick={() => handleQuizAnswer(word)}
                disabled={quizResult !== null}
                className={`
                  flex-1 min-h-12 py-3 px-3 rounded-xl font-medium text-base transition-all duration-200
                  ${
                    quizResult !== null
                      ? word.en === quiz.correctWord.en
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                      : "bg-pink-50 hover:bg-pink-100 text-gray-700 active:scale-95"
                  }
                `}
              >
                {word.en}
              </button>
              <SpeakIcon text={word.en} lang="en" voiceSpeed={voiceSpeed} label={`朗读 ${word.en}`} />
            </div>
          ))}
        </div>

        <button
          onClick={backToLearn}
          className="mt-4 w-full min-h-11 py-2 text-center text-base text-gray-500 hover:text-gray-700"
        >
          返回学习模式
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-lg font-bold text-gray-700">单词学习</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshBatch}
            className="text-sm bg-purple-100 text-purple-600 min-h-11 px-3 rounded-full hover:bg-purple-200 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            换一批
          </button>
          <button
            onClick={startQuiz}
            className="text-sm bg-pink-100 text-pink-600 min-h-11 px-3 rounded-full hover:bg-pink-200"
          >
            开始测验
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 text-center mb-4 space-y-3">
        <SpeakableText
          text={currentWord.en}
          lang="en"
          voiceSpeed={voiceSpeed}
          align="center"
          textClassName="text-4xl font-bold text-gray-800"
        />
        {showAnswer && (
          <SpeakableText
            text={currentWord.zh}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            className="animate-fadeIn"
            textClassName="text-xl text-gray-600"
          />
        )}
        {showAnswer && (
          <SpeakableText
            text={currentWord.sentence}
            lang="en"
            voiceSpeed={voiceSpeed}
            align="center"
            className="animate-fadeIn"
            textClassName="text-base text-gray-500 italic"
          >
            “{currentWord.sentence}”
          </SpeakableText>
        )}
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="min-h-12 bg-gray-500 text-white px-5 rounded-full text-base hover:bg-gray-600 active:scale-95 transition-all"
        >
          {showAnswer ? "隐藏意思" : "显示意思"}
        </button>
      </div>

      <p className="text-sm text-center text-pink-600 bg-pink-50 px-3 py-2 rounded-xl mb-3 leading-relaxed">
        可说「apple什么意思」「书本用英语怎么说」「换一批单词」
      </p>

      <div className="flex justify-between items-center">
        <button onClick={prevWord} className="text-gray-500 hover:text-pink-500 text-base min-h-11 px-2">
          ← 上一个
        </button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {words.length}
        </span>
        <button onClick={nextWord} className="text-gray-500 hover:text-pink-500 text-base min-h-11 px-2">
          下一个 →
        </button>
      </div>
    </div>
  );
}
