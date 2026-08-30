import type { AgentResponse, SessionContext } from "@/lib/core/types";
import { tryEvaluateFromText, parseAnswerNumber } from "@/lib/math/evaluate";
import {
  startDrill,
  nextQuestion,
  checkAnswer,
  getCurrentQuestion,
  isDrillActive,
} from "@/lib/math/drill-state";
import { formatMathQuestion } from "@/lib/math/evaluate";
import { withStudyNav } from "@/lib/skills/nav-skills";
import { updateSession } from "@/lib/session-store";

export function matchMathCalc(text: string, normalized: string): AgentResponse | null {
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

export function matchMathDrillAnswer(text: string, _ctx: SessionContext): AgentResponse | null {
  if (!isDrillActive()) return null;

  const num = parseAnswerNumber(text);
  if (num === null) return null;

  const q = getCurrentQuestion()!;
  const { correct, streak } = checkAnswer(num);

  if (correct) {
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

  return {
    intent: "math_drill_wrong",
    emotion: "thinking",
    action: "study",
    reply: `没关系，再想想~ 答案是 ${q.answer}。我们继续：${formatMathQuestion({ a: q.a, op: q.op, b: q.b })}`,
    navigate: "study",
    studySection: "math.drill",
    contentCard: {
      type: "math-drill",
      payload: { question: q },
    },
  };
}

export function buildMathDrillStartResponse(): AgentResponse {
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
