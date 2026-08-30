import { describe, expect, it, beforeEach } from "vitest";
import { matchWordProblemAnswer, submitWordProblemAnswer } from "./word-problem-skills";
import {
  clearWordProblem,
  setCurrentWordProblem,
  getCurrentWordProblem,
} from "@/lib/math/word-problem-state";
import { updateSession } from "@/lib/session-store";
import type { WordProblemItem } from "@/lib/providers/chinese-content";

const SAMPLE: WordProblemItem = {
  question: "小明有 5 个苹果，妈妈又给他 3 个，一共几个？",
  answer: 8,
  explain: "5 + 3 = 8 个苹果。",
  emoji: "🍎",
};

beforeEach(() => {
  clearWordProblem();
  updateSession({ lastStudySection: undefined });
});

describe("word-problem grading", () => {
  it("submitWordProblemAnswer scores tap input", () => {
    setCurrentWordProblem(SAMPLE);
    const ok = submitWordProblemAnswer(8);
    expect(ok?.intent).toBe("word_problem_correct");
    expect(ok?.reply).toContain(SAMPLE.explain);
    expect(getCurrentWordProblem()).not.toBeNull();

    setCurrentWordProblem(SAMPLE);
    const bad = submitWordProblemAnswer(3);
    expect(bad?.intent).toBe("word_problem_wrong");
    expect(bad?.reply).toContain("8");
  });

  it("matchWordProblemAnswer ignores numbers when not in section", () => {
    setCurrentWordProblem(SAMPLE);
    const res = matchWordProblemAnswer("8", { channel: "web" });
    expect(res).toBeNull();
  });

  it("matchWordProblemAnswer accepts 八 when listening", () => {
    setCurrentWordProblem(SAMPLE);
    const res = matchWordProblemAnswer("八", { channel: "web", lastStudySection: "math.word-problem" });
    expect(res?.intent).toBe("word_problem_correct");
  });
});
