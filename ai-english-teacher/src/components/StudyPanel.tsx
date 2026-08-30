"use client";

import type { ContentCard } from "@/lib/core/types";
import type { Word } from "@/lib/words";
import StudyCards from "@/components/StudyCards";
import MathDrill from "@/components/MathDrill";
import SpeakableLine from "@/components/ui/SpeakableLine";
import VoiceHintBar from "@/components/VoiceHintBar";
import { getVoiceHintForSection, SUB_TAB_VOICE_TIPS } from "@/lib/voice-hints";
import { splitSpeakableLines } from "@/lib/content/speakable";
import type { MathQuestion } from "@/lib/math/generator";
import {
  parseStudySection,
  buildStudySection,
  SUBJECT_LABELS,
  SUBJECT_PINYIN,
  SUBJECT_EMOJI,
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

function ContentCardView({ card, voiceSpeed }: { card: ContentCard; voiceSpeed?: number }) {
  const p = card.payload as Record<string, unknown> | undefined;

  switch (card.type) {
    case "pinyin": {
      const item = p?.item as { display: string; tip: string; emoji: string; example: string } | undefined;
      if (!item) return null;
      return (
        <div className="rounded-2xl border border-pink-100 bg-white p-5 text-center">
          <div className="mb-2 text-5xl">{item.emoji}</div>
          <SpeakableLine
            text={item.display}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            size="hero"
            textClassName="text-6xl font-bold text-pink-600"
          />
          <SpeakableLine
            text={item.tip}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            className="mt-2"
            textClassName="text-base text-gray-600"
          />
          <SpeakableLine
            text={item.example}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            className="mt-1"
            textClassName="text-base text-gray-600"
          >
            例：{item.example}
          </SpeakableLine>
        </div>
      );
    }
    case "hanzi": {
      const item = p?.item as { char: string; emoji: string; pinyin: string; words: string[]; sentence: string } | undefined;
      if (!item) return null;
      return (
        <div className="rounded-2xl border border-pink-100 bg-white p-5 text-center">
          <div className="mb-2 text-4xl">{item.emoji}</div>
          <SpeakableLine
            text={`${item.char}，${item.pinyin}`}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            size="hero"
            pinyin={item.pinyin}
            textClassName="text-7xl font-bold text-gray-800"
          >
            {item.char}
          </SpeakableLine>
          <SpeakableLine
            text={item.words.join("，")}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            className="mt-2"
            textClassName="text-base text-gray-600"
          >
            组词：{item.words.join(" · ")}
          </SpeakableLine>
          <SpeakableLine
            text={item.sentence}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            className="mt-1"
            textClassName="text-base text-gray-700"
          />
        </div>
      );
    }
    case "sentence": {
      const item = p?.item as { text: string; hint?: string } | undefined;
      if (!item) return null;
      return (
        <div className="rounded-2xl border border-pink-100 bg-white p-5">
          <SpeakableLine
            text={item.text}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            textClassName="text-2xl leading-relaxed text-gray-800 tracking-widest"
          />
          {item.hint && (
            <SpeakableLine
              text={item.hint}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              className="mt-2"
              textClassName="text-base text-gray-500"
            />
          )}
        </div>
      );
    }
    case "idiom": {
      const item = p?.item as { word: string; pinyin: string; meaning: string; example: string } | undefined;
      if (!item) return null;
      return (
        <div className="space-y-2 rounded-2xl border border-amber-100 bg-white p-5">
          <SpeakableLine
            text={`${item.word}，${item.pinyin}`}
            lang="zh"
            voiceSpeed={voiceSpeed}
            pinyin={item.pinyin}
            textClassName="text-3xl font-bold text-amber-800"
          >
            {item.word}
          </SpeakableLine>
          <SpeakableLine text={item.meaning} lang="zh" voiceSpeed={voiceSpeed} textClassName="text-base text-gray-700" />
          <SpeakableLine
            text={item.example}
            lang="zh"
            voiceSpeed={voiceSpeed}
            textClassName="text-base text-gray-600"
          >
            例：{item.example}
          </SpeakableLine>
        </div>
      );
    }
    case "english-sentence": {
      const item = p?.item as { en: string; zh: string; emoji: string } | undefined;
      if (!item) return null;
      return (
        <div className="space-y-2 rounded-2xl border border-blue-100 bg-white p-5 text-center">
          <div className="text-4xl">{item.emoji}</div>
          <SpeakableLine
            text={item.en}
            lang="en"
            voiceSpeed={voiceSpeed}
            align="center"
            textClassName="text-2xl font-semibold text-blue-700"
          />
          <SpeakableLine
            text={item.zh}
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            textClassName="text-base text-gray-600"
          />
        </div>
      );
    }
    case "word-problem": {
      const item = p?.item as { question: string; emoji: string; answer: number; explain: string } | undefined;
      if (!item) return null;
      return (
        <div className="space-y-2 rounded-2xl border border-green-100 bg-white p-5">
          <div className="text-center text-3xl">{item.emoji}</div>
          <SpeakableLine text={item.question} lang="zh" voiceSpeed={voiceSpeed} textClassName="text-base text-gray-800 leading-relaxed" />
        </div>
      );
    }
    case "poetry": {
      const item = p as { title?: string; author?: string; content?: string };
      const lines = item.content ? splitSpeakableLines(item.content) : [];
      return (
        <div className="space-y-1 rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50 to-white p-5">
          {item.title && (
            <SpeakableLine
              text={`《${item.title}》`}
              lang="zh"
              voiceSpeed={voiceSpeed}
              textClassName="text-xl font-bold text-amber-900"
            />
          )}
          {item.author && (
            <SpeakableLine text={item.author} lang="zh" voiceSpeed={voiceSpeed} textClassName="text-base text-gray-600" />
          )}
          {lines.map((line) => (
            <SpeakableLine
              key={line}
              text={line}
              lang="zh"
              voiceSpeed={voiceSpeed}
              textClassName="text-base text-gray-700 leading-loose"
            />
          ))}
        </div>
      );
    }
    default: {
      const text = (p?.text as string) || (p?.zh as string) || "";
      const title = p?.title as string | undefined;
      const lines = text ? splitSpeakableLines(text) : [];
      return text || title ? (
        <div className="space-y-1 rounded-2xl border border-pink-100 bg-white p-5">
          {title && (
            <SpeakableLine text={title} lang="auto" voiceSpeed={voiceSpeed} textClassName="text-lg font-bold text-gray-700" />
          )}
          {lines.map((line) => (
            <SpeakableLine
              key={line}
              text={line}
              lang="auto"
              voiceSpeed={voiceSpeed}
              textClassName="text-base text-gray-700 leading-relaxed"
            />
          ))}
        </div>
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
      <div className="flex items-start gap-1">
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={SUBJECT_LABELS[s]}
              onClick={() => setSubject(s)}
              className={`shrink-0 min-h-14 rounded-2xl px-3 py-1.5 text-base font-semibold leading-tight transition-all ${
                subject === s ? "bg-pink-500 text-white shadow-sm" : "bg-white text-gray-600 border border-pink-100"
              }`}
            >
              <span className="block">
                {SUBJECT_EMOJI[s]} {SUBJECT_LABELS[s]}
              </span>
              <span className={`block text-xs font-normal ${subject === s ? "text-pink-100" : "text-gray-500"}`}>
                {SUBJECT_PINYIN[s]}
              </span>
            </button>
          ))}
        </div>
        <VoiceHintBar text={voiceHint} voiceSpeed={voiceSpeed} />
      </div>

      {subTabs.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {subTabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              title={SUB_TAB_VOICE_TIPS[key] ? `可说「${SUB_TAB_VOICE_TIPS[key]}」` : undefined}
              onClick={() => setSub(key)}
              aria-label={label}
              className={`shrink-0 min-h-10 rounded-full px-3 py-1.5 text-sm ${
                sub === key ? "bg-pink-100 font-semibold text-pink-700" : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {contentCard && <ContentCardView card={contentCard} voiceSpeed={voiceSpeed} />}

      {subject === "english" && sub === "words" && (
        <StudyCards
          words={words}
          voiceSpeed={voiceSpeed}
          onWordLearned={onWordLearned}
          onQuizResult={onQuizResult}
        />
      )}

      {subject === "math" && sub === "drill" && mathQuestion && (
        <MathDrill question={mathQuestion} streak={mathStreak} onAnswer={onMathAnswer} voiceSpeed={voiceSpeed} />
      )}

      {subject === "math" && sub === "drill" && !mathQuestion && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
          <p className="mb-2 text-3xl">🐵</p>
          <p className="mb-3 text-base text-gray-600">口算练习加载中…</p>
          {onRefreshContent && (
            <button
              type="button"
              onClick={onRefreshContent}
              className="min-h-11 rounded-full border border-pink-200 bg-white px-4 text-base text-pink-600"
            >
              开始口算
            </button>
          )}
        </div>
      )}

      {onRefreshContent &&
        (subject === "chinese" ||
          subject === "reading" ||
          subject === "explore" ||
          (subject === "math" && sub === "word-problem") ||
          (subject === "english" && sub === "sentence")) && (
          <button
            type="button"
            onClick={onRefreshContent}
            className="flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-pink-50 text-sm text-pink-600 active:scale-[0.98]"
          >
            ↻ 换一个
          </button>
        )}
    </div>
  );
}
