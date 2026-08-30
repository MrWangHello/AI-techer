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
    reply: "这个我不太懂呢。试试说「讲故事」「背古诗」，或「书本用英语怎么说」「apple什么意思」查词~",
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
