import type { AgentResponse, SessionContext } from "@/lib/core/types";
import {
  extractDrillAnswer,
  mergeVoiceDrillDigit,
  resetDrillVoiceBuffer,
} from "@/lib/math/drill-answer";
import {
  checkWordProblemAnswer,
  getCurrentWordProblem,
  isWordProblemActive,
  setCurrentWordProblem,
} from "@/lib/math/word-problem-state";
import { pickRandomWordProblem } from "@/lib/providers/chinese-content";
import { updateSession } from "@/lib/session-store";

function listening(ctx: SessionContext): boolean {
  return isWordProblemActive() && ctx.lastStudySection === "math.word-problem";
}

function nextProblem() {
  const w = pickRandomWordProblem();
  setCurrentWordProblem(w);
  updateSession({ lastStudySection: "math.word-problem" });
  return w;
}

function buildResult(num: number): AgentResponse {
  const current = getCurrentWordProblem()!;
  const { correct } = checkWordProblemAnswer(num);

  if (correct) {
    resetDrillVoiceBuffer();
    const next = nextProblem();
    return {
      intent: "word_problem_correct",
      emotion: "happy",
      action: "study",
      reply: `对了！${current.explain} 下一题：${next.question} 想一想，答案是几？`,
      navigate: "study",
      studySection: "math.word-problem",
      contentCard: { type: "word-problem", payload: { item: next } },
    };
  }

  resetDrillVoiceBuffer();
  return {
    intent: "word_problem_wrong",
    emotion: "thinking",
    action: "study",
    reply: `再想想~ 正确答案是 ${current.answer}。${current.explain}`,
    navigate: "study",
    studySection: "math.word-problem",
    contentCard: { type: "word-problem", payload: { item: current } },
  };
}

/** 键盘点「确定」提交 */
export function submitWordProblemAnswer(num: number): AgentResponse | null {
  if (!isWordProblemActive()) return null;
  resetDrillVoiceBuffer();
  return buildResult(num);
}

export function matchWordProblemAnswer(text: string, ctx: SessionContext): AgentResponse | null {
  if (!listening(ctx)) return null;
  if (/[加减乘除]/.test(text) || /[+\-×÷]/.test(text)) return null;

  const q = getCurrentWordProblem()!;
  let num = extractDrillAnswer(text);
  if (num === null) return null;

  if (num < 10 && q.answer >= 10 && num >= 0) {
    const merged = mergeVoiceDrillDigit(num, q.answer);
    if (merged === null) {
      return {
        intent: "word_problem_buffer",
        emotion: "neutral",
        action: "study",
        reply: `听到 ${num} 了，继续说出个位数`,
        navigate: "study",
        studySection: "math.word-problem",
        contentCard: { type: "word-problem", payload: { item: q } },
      };
    }
    num = merged;
  } else {
    resetDrillVoiceBuffer();
  }

  return buildResult(num);
}
