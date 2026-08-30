"use client";

import type { ContentCard } from "@/lib/core/types";
import type { Word } from "@/lib/words";
import StudyCards from "@/components/StudyCards";
import MathDrill from "@/components/MathDrill";
import type { MathQuestion } from "@/lib/math/generator";
import {
  parseStudySection,
  buildStudySection,
  SUBJECT_LABELS,
  CHINESE_SUB_LABELS,
  ENGLISH_SUB_LABELS,
  MATH_SUB_LABELS,
  type StudySubject,
} from "@/lib/study-nav";

interface StudyPanelProps {
  studySection: string;
  onSectionChange: (section: string) => void;
  contentCard?: ContentCard | null;
  mathQuestion?: MathQuestion | null;
  mathStreak?: number;
  onMathAnswer?: (n: number) => void;
  words: Word[];
  onWordLearned: (word: { en: string; zh: string }) => void;
  onQuizResult: (correct: boolean) => void;
}

const SUBJECTS: StudySubject[] = ["english", "chinese", "math", "reading", "explore"];

function ContentCardView({ card }: { card: ContentCard }) {
  const p = card.payload as Record<string, unknown> | undefined;

  switch (card.type) {
    case "pinyin": {
      const item = p?.item as { display: string; tip: string; emoji: string; example: string };
      return (
        <div className="bg-white rounded-2xl p-6 text-center border border-pink-100">
          <div className="text-5xl mb-2">{item.emoji}</div>
          <div className="text-6xl font-bold text-pink-600 mb-2">{item.display}</div>
          <p className="text-sm text-gray-600">{item.tip}</p>
          <p className="text-xs text-gray-400 mt-2">例：{item.example}</p>
        </div>
      );
    }
    case "hanzi": {
      const item = p?.item as { char: string; emoji: string; pinyin: string; words: string[]; sentence: string };
      return (
        <div className="bg-white rounded-2xl p-6 text-center border border-pink-100">
          <div className="text-4xl mb-2">{item.emoji}</div>
          <div className="text-7xl font-bold text-gray-800 mb-1">{item.char}</div>
          <p className="text-sm text-pink-500">{item.pinyin}</p>
          <p className="text-xs text-gray-500 mt-2">组词：{item.words.join(" · ")}</p>
          <p className="text-sm text-gray-600 mt-3">{item.sentence}</p>
        </div>
      );
    }
    case "sentence": {
      const item = p?.item as { text: string; hint?: string };
      return (
        <div className="bg-white rounded-2xl p-6 border border-pink-100">
          <p className="text-2xl leading-relaxed text-gray-800 text-center tracking-widest">{item.text}</p>
          {item.hint && <p className="text-xs text-center text-gray-400 mt-3">{item.hint}</p>}
        </div>
      );
    }
    case "idiom": {
      const item = p?.item as { word: string; pinyin: string; meaning: string; example: string };
      return (
        <div className="bg-white rounded-2xl p-5 border border-amber-100">
          <h3 className="text-2xl font-bold text-amber-800">{item.word}</h3>
          <p className="text-xs text-gray-400">{item.pinyin}</p>
          <p className="text-sm text-gray-700 mt-2">{item.meaning}</p>
          <p className="text-xs text-gray-500 mt-2">例：{item.example}</p>
        </div>
      );
    }
    case "english-sentence": {
      const item = p?.item as { en: string; zh: string; emoji: string };
      return (
        <div className="bg-white rounded-2xl p-6 text-center border border-blue-100">
          <div className="text-4xl mb-2">{item.emoji}</div>
          <p className="text-lg font-semibold text-blue-700">{item.en}</p>
          <p className="text-sm text-gray-500 mt-2">{item.zh}</p>
        </div>
      );
    }
    case "word-problem": {
      const item = p?.item as { question: string; emoji: string; answer: number; explain: string };
      return (
        <div className="bg-white rounded-2xl p-5 border border-green-100">
          <div className="text-3xl text-center mb-2">{item.emoji}</div>
          <p className="text-sm text-gray-800 leading-relaxed">{item.question}</p>
          <p className="text-xs text-gray-400 mt-3">语音说出答案，或说「答案是 {item.answer}」</p>
        </div>
      );
    }
    case "poetry": {
      const item = p as { title?: string; author?: string; content?: string };
      return (
        <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-5 border border-amber-100">
          <h3 className="text-lg font-bold text-amber-900">《{item.title}》</h3>
          <p className="text-xs text-gray-500">{item.author}</p>
          <p className="text-sm text-gray-700 mt-3 whitespace-pre-line leading-loose">{item.content}</p>
        </div>
      );
    }
    default: {
      const text = (p?.text as string) || (p?.zh as string) || "";
      return text ? (
        <div className="bg-white rounded-2xl p-4 border border-pink-100 text-sm text-gray-700">{text}</div>
      ) : null;
    }
  }
}

export default function StudyPanel({
  studySection,
  onSectionChange,
  contentCard,
  mathQuestion,
  mathStreak,
  onMathAnswer,
  words,
  onWordLearned,
  onQuizResult,
}: StudyPanelProps) {
  const { subject, sub } = parseStudySection(studySection);

  const setSubject = (s: StudySubject) => {
    const defaultSub =
      s === "english" ? "words" : s === "chinese" ? "hanzi" : s === "math" ? "drill" : s === "reading" ? "story" : "weather";
    onSectionChange(buildStudySection(s, defaultSub));
  };

  const setSub = (newSub: string) => {
    onSectionChange(buildStudySection(subject, newSub));
  };

  const subTabs =
    subject === "chinese"
      ? Object.entries(CHINESE_SUB_LABELS)
      : subject === "english"
      ? Object.entries(ENGLISH_SUB_LABELS)
      : subject === "math"
      ? Object.entries(MATH_SUB_LABELS)
      : [];

  return (
    <div className="space-y-3">
      {/* 学科 Segmented */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSubject(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              subject === s ? "bg-pink-500 text-white shadow-sm" : "bg-white text-gray-500 border border-pink-100"
            }`}
          >
            {SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* 子模块 Segmented */}
      {subTabs.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {subTabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSub(key)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] ${
                sub === key ? "bg-pink-100 text-pink-700 font-medium" : "text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 内容区 */}
      {contentCard && <ContentCardView card={contentCard} />}

      {subject === "english" && sub === "words" && (
        <StudyCards words={words} onWordLearned={onWordLearned} onQuizResult={onQuizResult} />
      )}

      {subject === "math" && sub === "drill" && mathQuestion && (
        <MathDrill question={mathQuestion} streak={mathStreak} onAnswer={onMathAnswer} />
      )}

      {subject === "math" && sub === "drill" && !mathQuestion && (
        <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-100">
          <p className="text-3xl mb-2">🐵</p>
          <p className="text-sm text-gray-600">说「口算」或「算一算」开始练习！</p>
        </div>
      )}

      {subject === "reading" && (
        <div className="bg-purple-50 rounded-2xl p-5 text-center border border-purple-100">
          <p className="text-sm text-gray-600">说「讲笑话」或「讲故事」~</p>
        </div>
      )}

      {subject === "explore" && (
        <div className="bg-sky-50 rounded-2xl p-5 text-center border border-sky-100">
          <p className="text-sm text-gray-600">说「北京天气」或「猫是什么」~</p>
        </div>
      )}

      {subject === "chinese" && !contentCard && ["pinyin", "hanzi", "sentence"].includes(sub) && (
        <div className="bg-rose-50 rounded-2xl p-5 text-center border border-rose-100">
          <p className="text-sm text-gray-600">
            说「{CHINESE_SUB_LABELS[sub]}」开始，例如：认字、读拼音、读句子
          </p>
        </div>
      )}

      <p className="text-[10px] text-center text-gray-300">💡 按住底部麦克风说话，自动跳转到这里</p>
    </div>
  );
}
