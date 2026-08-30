import { clearDrill, getCurrentQuestion, isDrillActive } from "@/lib/math/drill-state";
import type { AgentResponse } from "@/lib/core/types";
import type { MathQuestion } from "@/lib/math/generator";

function drillContentCard(q: MathQuestion | null) {
  if (!q) return undefined;
  return {
    type: "math-drill" as const,
    payload: { question: q },
  };
}

export function buildDrillActiveHint(): AgentResponse {
  const q = getCurrentQuestion();
  return {
    intent: "math_drill_hint",
    emotion: "neutral",
    action: "study",
    reply: q
      ? `口算中哦～请直接说数字，比如「${q.answer}」或「答案是 ${q.answer}」，也可以点下方键盘输入。说「停止口算」可退出。`
      : "口算中哦～请说出数字答案，或点键盘输入。",
    navigate: "study",
    studySection: "math.drill",
    contentCard: drillContentCard(q),
  };
}

export function drillActiveFallback(): AgentResponse | null {
  if (!isDrillActive()) return null;
  return buildDrillActiveHint();
}

export function buildDrillExitResponse(): AgentResponse {
  clearDrill();
  return {
    intent: "math_drill_exit",
    emotion: "happy",
    action: "study",
    reply: "好的，口算先停一下~ 想继续时说「口算」就行！",
    navigate: "study",
    studySection: "math.drill",
  };
}
