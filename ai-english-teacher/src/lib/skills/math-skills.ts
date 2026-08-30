import type { AgentResponse, SessionContext } from "@/lib/core/types";
import { tryEvaluateFromText } from "@/lib/math/evaluate";
import {
  startDrill,
  nextQuestion,
  checkAnswer,
  getCurrentQuestion,
  isDrillActive,
} from "@/lib/math/drill-state";
import { formatMathQuestion } from "@/lib/math/evaluate";
import {
  extractDrillAnswer,
  mergeVoiceDrillDigit,
  resetDrillVoiceBuffer,
} from "@/lib/math/drill-answer";
import { withStudyNav } from "@/lib/skills/nav-skills";
import { updateSession } from "@/lib/session-store";

export function matchMathCalc(text: string, normalized: string): AgentResponse | null {
  if (isDrillActive()) return null;
  const result = tryEvaluateFromText(text);
  if (!result) return null;

  updateSession({ lastStudySection: "math", mathDrillActive: false });

  return {
    intent: "math_calc",
    emotion: "happy",
    action: "study",
    reply: result.reply,
    navigate: "study",
    studySection: "math",
  };
}

function buildDrillResult(num: number): AgentResponse {
  const q = getCurrentQuestion()!;
  const { correct, streak } = checkAnswer(num);

  if (correct) {
    resetDrillVoiceBuffer();
    const next = nextQuestion(1);
    updateSession({ lastStudySection: "math.drill", mathDrillActive: true });
    const praise =
      streak >= 3
        ? `太棒了！连对 ${streak} 题！🎉 下一题：${next.scenario}`
        : `对了！真棒！下一题：${next.scenario}`;

    return {
      intent: "math_drill_correct",
      emotion: "happy",
      action: "study",
      reply: praise,
      navigate: "study",
      studySection: "math.drill",
      sideEffect: "math.drill.next",
      contentCard: {
        type: "math-drill",
        payload: { question: next },
      },
    };
  }

  resetDrillVoiceBuffer();
  return {
    intent: "math_drill_wrong",
    emotion: "thinking",
    action: "study",
    reply: `没关系，再想想~ 答案是 ${q.answer}。${formatMathQuestion({ a: q.a, op: q.op, b: q.b })}`,
    navigate: "study",
    studySection: "math.drill",
    contentCard: {
      type: "math-drill",
      payload: { question: q },
    },
  };
}

/** 键盘点「确定」提交 — 不经过语音缓冲 */
export function submitDrillAnswer(num: number): AgentResponse | null {
  if (!isDrillActive()) return null;
  resetDrillVoiceBuffer();
  return buildDrillResult(num);
}

export function matchMathDrillAnswer(text: string, _ctx: SessionContext): AgentResponse | null {
  if (!isDrillActive()) return null;
  if (/[加减乘除]/.test(text) || /[+\-×÷]/.test(text)) return null;

  const q = getCurrentQuestion()!;
  let num = extractDrillAnswer(text);
  if (num === null) return null;

  if (num < 10 && q.answer >= 10 && num >= 0) {
    const merged = mergeVoiceDrillDigit(num, q.answer);
    if (merged === null) {
      return {
        intent: "math_drill_buffer",
        emotion: "neutral",
        action: "study",
        reply: `听到 ${num} 了，继续说出个位数，或者说「${q.answer}」`,
        navigate: "study",
        studySection: "math.drill",
        contentCard: {
          type: "math-drill",
          payload: { question: q },
        },
      };
    }
    num = merged;
  } else {
    resetDrillVoiceBuffer();
  }

  return buildDrillResult(num);
}

export function buildMathDrillStartResponse(): AgentResponse {
  resetDrillVoiceBuffer();
  const q = startDrill(1);
  updateSession({ lastStudySection: "math.drill", mathDrillActive: true });

  return withStudyNav(
    {
      intent: "math_drill_start",
      emotion: "happy",
      action: "study",
      reply: `${q.scenario}（${q.a} ${q.op} ${q.b} = ?）`,
      sideEffect: "math.drill.start",
      contentCard: {
        type: "math-drill",
        payload: { question: q },
      },
    },
    "math.drill"
  );
}
