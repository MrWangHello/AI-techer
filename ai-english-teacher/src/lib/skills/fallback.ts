import type { AgentResponse } from "@/lib/core/types";

const FALLBACKS: AgentResponse[] = [
  {
    intent: "unknown",
    emotion: "neutral",
    action: "none",
    reply: "嗯...我还在学习理解你说的话。试试说「帮助」查看我能做什么？",
  },
  {
    intent: "unknown",
    emotion: "thinking",
    action: "none",
    reply: "这个我不太懂呢。你可以说「每日英语」「背古诗」或「开始学习」~",
  },
  {
    intent: "unknown",
    emotion: "happy",
    action: "none",
    reply: "喵？试试说「帮助」，我来告诉你我能做什么！",
  },
];

export function fallbackSkill(): AgentResponse {
  return { ...FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] };
}
