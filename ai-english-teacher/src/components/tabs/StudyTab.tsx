"use client";

import StudyPanel from "@/components/StudyPanel";
import type { ContentCard } from "@/lib/core/types";
import type { MathQuestion } from "@/lib/math/generator";
import type { PetData } from "@/lib/pet-data";
import type { Word } from "@/lib/words";

export default function StudyTab({
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
    <div className="animate-slideUp">
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
    </div>
  );
}
