"use client";

import StudyPanel from "@/components/StudyPanel";
import Card from "@/components/ui/Card";
import SpeakIcon from "@/components/ui/SpeakIcon";
import StatBlock from "@/components/ui/StatBlock";
import type { ContentCard } from "@/lib/core/types";
import type { MathQuestion } from "@/lib/math/generator";
import type { PetData } from "@/lib/pet-data";
import { getAllWords, type Word } from "@/lib/words";

export default function StudyTab({
  pet,
  studySection,
  contentCard,
  mathQuestion,
  mathStreak,
  words,
  voiceSpeed,
  onSectionChange,
  onMathAnswer,
  onRefreshContent,
  onWordLearned,
  onQuizResult,
}: {
  pet: PetData;
  studySection: string;
  contentCard: ContentCard | null;
  mathQuestion: MathQuestion | null;
  mathStreak: number;
  words: Word[];
  voiceSpeed: number;
  onSectionChange: (section: string) => void;
  onMathAnswer: (n: number) => void;
  onRefreshContent: () => void;
  onWordLearned: (word: { en: string; zh: string }) => void;
  onQuizResult: (correct: boolean) => void;
}) {
  return (
    <div className="space-y-4 animate-slideUp">
      <StudyPanel
        studySection={studySection}
        onSectionChange={onSectionChange}
        contentCard={contentCard}
        mathQuestion={mathQuestion}
        mathStreak={mathStreak}
        onMathAnswer={onMathAnswer}
        onRefreshContent={onRefreshContent}
        words={words}
        onWordLearned={onWordLearned}
        onQuizResult={onQuizResult}
        voiceSpeed={voiceSpeed}
      />

      <Card>
        <h3 className="text-base font-bold text-gray-700 mb-3">学习统计</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBlock value={`${pet.learnedWords.length}/${getAllWords().length}`} label="已学单词" accent="purple" />
          <StatBlock
            value={pet.quizTotal > 0 ? `${pet.quizCorrect}/${pet.quizTotal}` : "0/0"}
            label="测验正确"
            accent="green"
          />
          <StatBlock value={`${pet.totalStudyTime} 分钟`} label="累计学习" accent="amber" />
          <StatBlock
            value={pet.quizTotal > 0 ? `${Math.round((pet.quizCorrect / pet.quizTotal) * 100)}%` : "0%"}
            label="正确率"
            accent="rose"
          />
        </div>

        <h4 className="text-sm font-bold text-gray-600 mb-2">已学单词</h4>
        <div className="flex flex-wrap gap-2">
          {pet.learnedWords.map((word, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 px-2 py-1 rounded-full">
              {word}
              <SpeakIcon text={word} lang="en" voiceSpeed={voiceSpeed} className="w-9 h-9 min-w-9 min-h-9" label={`朗读 ${word}`} />
            </span>
          ))}
          {pet.learnedWords.length === 0 && (
            <span className="text-sm text-gray-500">还没有学过的单词</span>
          )}
        </div>
      </Card>
    </div>
  );
}
