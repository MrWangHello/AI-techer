import type { MathQuestion } from "@/lib/math/generator";
import { generateQuestion } from "@/lib/math/generator";

let current: MathQuestion | null = null;
let streak = 0;

export function getCurrentQuestion(): MathQuestion | null {
  return current;
}

export function startDrill(grade: 1 | 2 | 3 = 1): MathQuestion {
  current = generateQuestion(grade);
  streak = 0;
  return current;
}

export function nextQuestion(grade: 1 | 2 | 3 = 1): MathQuestion {
  current = generateQuestion(grade);
  return current;
}

export function checkAnswer(answer: number): { correct: boolean; streak: number } {
  if (!current) return { correct: false, streak: 0 };
  const correct = answer === current.answer;
  if (correct) streak += 1;
  else streak = 0;
  return { correct, streak };
}

export function getStreak(): number {
  return streak;
}

export function clearDrill(): void {
  current = null;
  streak = 0;
}

export function isDrillActive(): boolean {
  return current !== null;
}
