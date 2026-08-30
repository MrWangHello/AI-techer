"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Word, loadWordBatch, refreshWordBatch } from "@/lib/words";
import { speakEnglish, warmUpSpeech } from "@/lib/speech";
import { Volume2, Volume1, RefreshCw } from "lucide-react";

interface StudyCardsProps {
  words?: Word[];
  onWordLearned?: (word: Word) => void;
  onQuizResult?: (correct: boolean) => void;
}

export default function StudyCards({ words: wordsProp, onWordLearned, onQuizResult }: StudyCardsProps) {
  const [words, setWords] = useState<Word[]>(() => wordsProp ?? loadWordBatch());
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [speakingWord, setSpeakingWord] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
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

  const speakWord = () => {
    if (!currentWord) return;
    ensureWarmup();
    setTtsError(null);
    setSpeakingWord(true);
    const success = speakEnglish(currentWord.en, () => setSpeakingWord(false));
    if (!success) {
      setTtsError("语音合成不可用，请使用 Chrome 浏览器");
      setSpeakingWord(false);
    }
  };

  const speakSentence = () => {
    if (!currentWord) return;
    ensureWarmup();
    setTtsError(null);
    setSpeakingWord(true);
    const success = speakEnglish(currentWord.sentence, () => setSpeakingWord(false));
    if (!success) {
      setTtsError("语音合成不可用，请使用 Chrome 浏览器");
      setSpeakingWord(false);
    }
  };

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
      <div className="bg-white/80 rounded-2xl p-5 text-center text-sm text-gray-400">
        词库加载中…
      </div>
    );
  }

  if (mode === "quiz") {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700">📝 单词测验</h3>
          <span className="text-sm text-gray-400">
            得分: {score}/{quizIndex + 1}
          </span>
        </div>

        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-pink-600 mb-2">{quiz.correctWord.zh}</div>
          <div className="text-sm text-gray-400">请选择对应的英文</div>
        </div>

        {quizResult !== null && (
          <div
            className={`text-center py-2 rounded-lg mb-3 ${
              quizResult ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}
          >
            {quizResult ? "✅ 回答正确！" : `❌ 正确答案: ${quiz.correctWord.en}`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {quiz.options.map((word, i) => (
            <button
              key={i}
              onClick={() => handleQuizAnswer(word)}
              disabled={quizResult !== null}
              className={`
                py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200
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
        <div className="flex gap-2">
          <button
            onClick={handleRefreshBatch}
            className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            换一批
          </button>
          <button
            onClick={startQuiz}
            className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full hover:bg-pink-200"
          >
            开始测验
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 text-center mb-4">
        <div className="text-3xl font-bold text-gray-800 mb-1">{currentWord.en}</div>
        {showAnswer && (
          <div className="text-lg text-gray-500 mt-2 animate-fadeIn">{currentWord.zh}</div>
        )}
        {showAnswer && (
          <div className="text-sm text-gray-400 mt-2 italic">&ldquo;{currentWord.sentence}&rdquo;</div>
        )}
      </div>

      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={speakWord}
          disabled={speakingWord}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm active:scale-95 transition-all ${
            speakingWord ? "bg-green-500 text-white" : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          {speakingWord ? <Volume1 className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          {speakingWord ? "播放中..." : "朗读"}
        </button>
        <button
          onClick={speakSentence}
          disabled={speakingWord}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm active:scale-95 transition-all ${
            speakingWord ? "bg-green-500 text-white" : "bg-purple-500 text-white hover:bg-purple-600"
          }`}
        >
          {speakingWord ? <Volume1 className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          {speakingWord ? "播放中..." : "例句"}
        </button>
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex items-center gap-1.5 bg-gray-500 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-600 active:scale-95 transition-all"
        >
          {showAnswer ? "隐藏" : "显示"}
        </button>
      </div>

      {ttsError && (
        <div className="text-center mb-3">
          <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{ttsError}</span>
        </div>
      )}

      <div className="text-center mb-2">
        <span className="text-[10px] text-gray-300">
          {speakingWord ? "🔊 正在朗读..." : "点击朗读按钮听取发音 · 说「换一批单词」也可刷新"}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={prevWord} className="text-gray-400 hover:text-pink-500 text-sm">
          ← 上一个
        </button>
        <span className="text-xs text-gray-300">
          {currentIndex + 1} / {words.length}
        </span>
        <button onClick={nextWord} className="text-gray-400 hover:text-pink-500 text-sm">
          下一个 →
        </button>
      </div>
    </div>
  );
}
