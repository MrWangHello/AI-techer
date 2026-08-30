export type TabTarget = "home" | "pet" | "study" | "settings";

export type AgentEmotion = "happy" | "sad" | "surprised" | "neutral" | "thinking";

export type AgentAction = "feed" | "play" | "study" | "quiz" | "greeting" | "checkin" | "none";

export interface AgentResponse {
  intent: string;
  emotion: AgentEmotion;
  action: AgentAction;
  reply: string;
  navigate?: TabTarget;
  sideEffect?: "word.refresh";
}

export interface UserMessage {
  text: string;
  channel: "web" | "wechat_mp" | "wechat_mini";
}

export interface SessionContext {
  channel: UserMessage["channel"];
}

export interface RuleEntry {
  skillId: string;
  keywords: string[];
  response: AgentResponse;
}

export interface AsyncSkill {
  id: string;
  /** 命中后由 orchestrator 调用 execute */
  keywords: string[];
  execute: (text: string, normalized: string) => Promise<AgentResponse>;
}
