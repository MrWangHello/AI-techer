"use client";

import type { ContentCard } from "@/lib/core/types";
import type { Word } from "@/lib/words";
import StudyCards from "@/components/StudyCards";
import MathDrill from "@/components/MathDrill";
import SpeakAloudButton from "@/components/SpeakAloudButton";
import SpeakableText from "@/components/ui/SpeakableText";
import VoiceHintBar from "@/components/VoiceHintBar";
import { getVoiceHintForSection, SUB_TAB_VOICE_TIPS } from "@/lib/voice-hints";
import { getSpeakableFromCard } from "@/lib/content/speakable";
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
      const item = p?.item as { display: string; tip: string; emoji: string; example: string } | undefined;
      if (!item) return null;
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 text-center border border-pink-100">
            <div className="text-5xl mb-3">{item.emoji}</div>
            <SpeakableText
              text={item.display}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              textClassName="text-6xl font-bold text-pink-600"
            />
            <SpeakableText
              text={item.tip}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              className="mt-3"
              textClassName="text-base text-gray-600"
            />
            <SpeakableText
              text={item.example}
              speakText={item.example}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              className="mt-3"
              textClassName="text-base text-gray-600"
            >
              例：{item.example}
            </SpeakableText>
          </div>
        </CardShell>
      );
    }
    case "hanzi": {
      const item = p?.item as { char: string; emoji: string; pinyin: string; words: string[]; sentence: string } | undefined;
      if (!item) return null;
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 text-center border border-pink-100">
            <div className="text-4xl mb-3">{item.emoji}</div>
            <SpeakableText
              text={`${item.char}，${item.pinyin}`}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              textClassName="text-7xl font-bold text-gray-800"
            >
              {item.char}
            </SpeakableText>
            <p className="text-xl text-pink-500 mt-2">{item.pinyin}</p>
            <SpeakableText
              text={item.words.join("，")}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              className="mt-3"
              textClassName="text-base text-gray-600"
            >
              组词：{item.words.join(" · ")}
            </SpeakableText>
            <SpeakableText
              text={item.sentence}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              className="mt-3"
              textClassName="text-base text-gray-700"
            />
          </div>
        </CardShell>
      );
    }
    case "sentence": {
      const item = p?.item as { text: string; hint?: string } | undefined;
      if (!item) return null;
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 border border-pink-100">
            <SpeakableText
              text={item.text}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              textClassName="text-2xl leading-relaxed text-gray-800 tracking-widest"
            />
            {item.hint && (
              <SpeakableText
                text={item.hint}
                lang="zh"
                voiceSpeed={voiceSpeed}
                align="center"
                className="mt-3"
                textClassName="text-base text-gray-500"
              />
            )}
          </div>
        </CardShell>
      );
    }
    case "idiom": {
      const item = p?.item as { word: string; pinyin: string; meaning: string; example: string } | undefined;
      if (!item) return null;
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-5 border border-amber-100 space-y-3">
            <SpeakableText
              text={`${item.word}，${item.pinyin}`}
              lang="zh"
              voiceSpeed={voiceSpeed}
              textClassName="text-3xl font-bold text-amber-800"
            >
              {item.word}
            </SpeakableText>
            <p className="text-base text-pink-500">{item.pinyin}</p>
            <SpeakableText text={item.meaning} lang="zh" voiceSpeed={voiceSpeed} textClassName="text-base text-gray-700" />
            <SpeakableText
              text={item.example}
              lang="zh"
              voiceSpeed={voiceSpeed}
              textClassName="text-base text-gray-600"
            >
              例：{item.example}
            </SpeakableText>
          </div>
        </CardShell>
      );
    }
    case "english-sentence": {
      const item = p?.item as { en: string; zh: string; emoji: string } | undefined;
      if (!item) return null;
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-6 text-center border border-blue-100 space-y-3">
            <div className="text-4xl">{item.emoji}</div>
            <SpeakableText
              text={item.en}
              lang="en"
              voiceSpeed={voiceSpeed}
              align="center"
              textClassName="text-2xl font-semibold text-blue-700"
            />
            <SpeakableText
              text={item.zh}
              lang="zh"
              voiceSpeed={voiceSpeed}
              align="center"
              textClassName="text-base text-gray-600"
            />
          </div>
        </CardShell>
      );
    }
    case "word-problem": {
      const item = p?.item as { question: string; emoji: string; answer: number; explain: string } | undefined;
      if (!item) return null;
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-5 border border-green-100 space-y-3">
            <div className="text-3xl text-center">{item.emoji}</div>
            <SpeakableText text={item.question} lang="zh" voiceSpeed={voiceSpeed} textClassName="text-base text-gray-800 leading-relaxed" />
            <p className="text-sm text-gray-500">语音说出答案，或说「答案是 {item.answer}」</p>
          </div>
        </CardShell>
      );
    }
    case "poetry": {
      const item = p as { title?: string; author?: string; content?: string };
      return (
        <CardShell speakText={speakText} voiceSpeed={voiceSpeed}>
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-5 border border-amber-100 space-y-3">
            {item.title && (
              <SpeakableText
                text={`《${item.title}》`}
                lang="zh"
                voiceSpeed={voiceSpeed}
                textClassName="text-xl font-bold text-amber-900"
              />
            )}
            {item.author && (
              <SpeakableText text={item.author} lang="zh" voiceSpeed={voiceSpeed} textClassName="text-base text-gray-600" />
            )}
            {item.content && (
              <SpeakableText
                text={item.content.replace(/\n/g, "，")}
                lang="zh"
                voiceSpeed={voiceSpeed}
                className="items-start"
                textClassName="text-base text-gray-700 whitespace-pre-line leading-loose"
              >
                {item.content}
              </SpeakableText>
            )}
          </div>
        </CardShell>
      );
    }
    default: {
      const text = (p?.text as string) || (p?.zh as string) || "";
      const title = p?.title as string | undefined;
      return text ? (
        <CardShell speakText={speakText || text} voiceSpeed={voiceSpeed}>
          <div className="bg-white rounded-2xl p-5 border border-pink-100 space-y-3">
            {title && (
              <SpeakableText text={title} lang="auto" voiceSpeed={voiceSpeed} textClassName="text-lg font-bold text-gray-700" />
            )}
            <SpeakableText
              text={text}
              lang="auto"
              voiceSpeed={voiceSpeed}
              className="items-start"
              textClassName="text-base text-gray-700 leading-relaxed whitespace-pre-line"
            />
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
      <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            aria-label={SUBJECT_LABELS[s]}
            onClick={() => setSubject(s)}
            className={`shrink-0 min-h-14 px-3.5 py-2 rounded-2xl text-base font-semibold transition-all leading-tight ${
              subject === s ? "bg-pink-500 text-white shadow-sm" : "bg-white text-gray-600 border border-pink-100"
            }`}
          >
            <span className="block">
              {SUBJECT_EMOJI[s]} {SUBJECT_LABELS[s]}
            </span>
            <span className={`block text-sm font-normal ${subject === s ? "text-pink-100" : "text-gray-500"}`}>
              {SUBJECT_PINYIN[s]}
            </span>
          </button>
        ))}
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
              className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-base ${
                sub === key ? "bg-pink-100 text-pink-700 font-semibold" : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <VoiceHintBar text={voiceHint} voiceSpeed={voiceSpeed} />

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
        <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-100">
          <p className="text-3xl mb-2">🐵</p>
          <p className="text-base text-gray-600 mb-3">口算练习加载中…</p>
          {onRefreshContent && (
            <button
              type="button"
              onClick={onRefreshContent}
              className="text-base text-pink-600 bg-white min-h-11 px-4 rounded-full border border-pink-200"
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
            className="w-full text-base text-pink-600 min-h-12 rounded-xl bg-pink-50 border border-pink-100 active:scale-[0.98]"
          >
            换一个
          </button>
        )}

      <p className="text-sm text-center text-gray-500">点击麦克风说话或长按 · 说「帮助」查看全部指令</p>
    </div>
  );
}
