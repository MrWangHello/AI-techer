"use client";

import type { ContentCard } from "@/lib/core/types";
import type { Word } from "@/lib/words";
import StudyCards from "@/components/StudyCards";
import MathDrill from "@/components/MathDrill";
import SpeakAloudButton from "@/components/SpeakAloudButton";
import VoiceHintBar from "@/components/VoiceHintBar";
import { getVoiceHintForSection, SUB_TAB_VOICE_TIPS } from "@/lib/voice-hints";
import { getSpeakableFromCard } from "@/lib/content/speakable";
import type { MathQuestion } from "@/lib/math/generator";
import {
  parseStudySection,
  buildStudySection,
  SUBJECT_LABELS,
  CHINESE_SUB_LABELS,
  ENGLISH_SUB_LABELS,
  MATH_SUB_LABELS,
  READING_SUB_LABELS,
  EXPLORE_SUB_LABELS,
  type StudySubject,
} from "@/lib/study-nav";

interface StudyPanelProps {
  studySection: string;
  onSectionChange: (section: string) => void;
  contentCard?: ContentCard | null;
  mathQuestion?: MathQuestion | null;
  mathStreak?: number;
  onMathAnswer?: (n: number) => void;
  onRefreshContent?: () => void;
  words: Word[];
  onWordLearned: (word: { en: string; zh: string }) => void;
  onQuizResult: (correct: boolean) => void;
  voiceSpeed?: number;
}

const SUBJECTS: StudySubject[] = ["english", "chinese", "math", "reading", "explore"];

function CardShell({
  children,
  speakText,
  voiceSpeed,
}: {
  children: React.ReactNode;
  speakText?: string;
  voiceSpeed?: number;
}) {
  return (
    <div className="relative">
      {children}
      {speakText && (
        <div className="flex justify-center mt-3">
          <SpeakAloudButton text={speakText} voiceSpeed={voiceSpeed} />
        </div>
      )}
    </div>
  );
}

function ContentCardView({ card, voiceSpeed }: { card: ContentCard; voiceSpeed?: number }) {
  const speakText = getSpeakableFromCard(card);
  const p = card.payload as Record<string, unknown> | undefined;

  switch (card.type) {
    case "pinyin": {
      const item = p?.item as { display: string; tip: string; emoji: string; example: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 text-center border border-pink-100">
            <div className="text-5xl mb-2">{item.emoji}</div>
            <div className="text-6xl font-bold text-pink-600 mb-2">{item.display}</div>
            <p className="text-sm text-gray-600">{item.tip}</p>
            <p className="text-xs text-gray-400 mt-2">例：{item.example}</p>
          </div>
        </CardShell>
      );
    }
    case "hanzi": {
      const item = p?.item as { char: string; emoji: string; pinyin: string; words: string[]; sentence: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 text-center border border-pink-100">
            <div className="text-4xl mb-2">{item.emoji}</div>
            <div className="text-7xl font-bold text-gray-800 mb-1">{item.char}</div>
            <p className="text-sm text-pink-500">{item.pinyin}</p>
            <p className="text-xs text-gray-500 mt-2">组词：{item.words.join(" · ")}</p>
            <p className="text-sm text-gray-600 mt-3">{item.sentence}</p>
          </div>
        </CardShell>
      );
    }
    case "sentence": {
      const item = p?.item as { text: string; hint?: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 border border-pink-100">
            <p className="text-2xl leading-relaxed text-gray-800 text-center tracking-widest">{item.text}</p>
            {item.hint && <p className="text-xs text-center text-gray-400 mt-3">{item.hint}</p>}
          </div>
        </CardShell>
      );
    }
    case "idiom": {
      const item = p?.item as { word: string; pinyin: string; meaning: string; example: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-5 border border-amber-100">
            <h3 className="text-2xl font-bold text-amber-800">{item.word}</h3>
            <p className="text-xs text-gray-400">{item.pinyin}</p>
            <p className="text-sm text-gray-700 mt-2">{item.meaning}</p>
            <p className="text-xs text-gray-500 mt-2">例：{item.example}</p>
          </div>
        </CardShell>
      );
    }
    case "english-sentence": {
      const item = p?.item as { en: string; zh: string; emoji: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 text-center border border-blue-100">
            <div className="text-4xl mb-2">{item.emoji}</div>
            <p className="text-lg font-semibold text-blue-700">{item.en}</p>
            <p className="text-sm text-gray-500 mt-2">{item.zh}</p>
          </div>
        </CardShell>
      );
    }
    case "word-problem": {
      const item = p?.item as { question: string; emoji: string; answer: number; explain: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-5 border border-green-100">
            <div className="text-3xl text-center mb-2">{item.emoji}</div>
            <p className="text-sm text-gray-800 leading-relaxed">{item.question}</p>
            <p className="text-xs text-gray-400 mt-3">语音说出答案，或说「答案是 {item.answer}」</p>
          </div>
        </CardShell>
      );
    }
    case "poetry": {
      const item = p as { title?: string; author?: string; content?: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-5 border border-amber-100">
            <h3 className="text-lg font-bold text-amber-900">《{item.title}》</h3>
            <p className="text-xs text-gray-500">{item.author}</p>
            <p className="text-sm text-gray-700 mt-3 whitespace-pre-line leading-loose">{item.content}</p>
          </div>
        </CardShell>
      );
    }
    default: {
      const text = (p?.text as string) || (p?.zh as string) || "";
      const title = p?.title as string | undefined;
      return text ? (
        <CardShell speakText={speakText || text} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-4 border border-pink-100">
            {title && <p className="text-sm font-bold text-gray-700 mb-2">{title}</p>}
            <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
          </div>
        </CardShell>
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
  onRefreshContent,
  words,
  onWordLearned,
  onQuizResult,
  voiceSpeed = 1,
}: StudyPanelProps) {
  const { subject, sub } = parseStudySection(studySection);
  const voiceHint = getVoiceHintForSection(studySection);

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
      : subject === "reading"
      ? Object.entries(READING_SUB_LABELS)
      : subject === "explore"
      ? Object.entries(EXPLORE_SUB_LABELS)
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
              title={SUB_TAB_VOICE_TIPS[key] ? `可说「${SUB_TAB_VOICE_TIPS[key]}」` : undefined}
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

      <VoiceHintBar text={voiceHint} />

      {/* 内容区 */}
      {contentCard && <ContentCardView card={contentCard} voiceSpeed={voiceSpeed} />}

      {subject === "english" && sub === "words" && (
        <StudyCards words={words} onWordLearned={onWordLearned} onQuizResult={onQuizResult} />
      )}

      {subject === "math" && sub === "drill" && mathQuestion && (
        <MathDrill question={mathQuestion} streak={mathStreak} onAnswer={onMathAnswer} />
      )}

      {subject === "math" && sub === "drill" && !mathQuestion && (
        <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-100">
          <p className="text-3xl mb-2">🐵</p>
          <p className="text-sm text-gray-600 mb-3">口算练习加载中…</p>
          {onRefreshContent && (
            <button
              type="button"
              onClick={onRefreshContent}
              className="text-xs text-pink-600 bg-white px-3 py-1.5 rounded-full border border-pink-200"
            >
              开始口算
            </button>
          )}
        </div>
      )}

      {onRefreshContent &&
        (subject === "chinese" || subject === "reading" || subject === "explore" || (subject === "math" && sub === "word-problem") || (subject === "english" && sub === "sentence")) && (
          <button
            type="button"
            onClick={onRefreshContent}
            className="w-full text-xs text-pink-600 py-2 rounded-xl bg-pink-50 border border-pink-100 active:scale-[0.98]"
          >
            🔄 换一个
          </button>
        )}

      <p className="text-[10px] text-center text-gray-400">点击 🎤 说话或长按 · 说「帮助」查看全部指令</p>
    </div>
  );
}
