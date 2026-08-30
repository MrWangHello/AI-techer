import type { WordProblemItem } from "@/lib/providers/chinese-content";

let current: WordProblemItem | null = null;

export function getCurrentWordProblem(): WordProblemItem | null {
  return current;
}

export function setCurrentWordProblem(item: WordProblemItem): void {
  current = item;
}

export function isWordProblemActive(): boolean {
  return current !== null;
}

export function clearWordProblem(): void {
  current = null;
}

export function checkWordProblemAnswer(answer: number): { correct: boolean } {
  if (!current) return { correct: false };
  return { correct: answer === current.answer };
}
