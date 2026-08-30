export type TabTarget = "home" | "pet" | "study" | "settings";

export type AgentEmotion = "happy" | "sad" | "surprised" | "neutral" | "thinking";

export type AgentAction = "feed" | "play" | "study" | "quiz" | "greeting" | "checkin" | "none";

export type SideEffect =
  | "word.refresh"
  | "math.drill.start"
  | "math.drill.next"
  | "chinese.next";

export interface ContentCard {
  type:
    | "pinyin"
    | "hanzi"
    | "sentence"
    | "idiom"
    | "word-problem"
    | "english-sentence"
    | "math-drill"
    | "poetry"
    | "text";
  payload?: Record<string, unknown>;
}

export interface AgentResponse {
  intent: string;
  emotion: AgentEmotion;
  action: AgentAction;
  reply: string;
  navigate?: TabTarget;
  /** e.g. chinese.hanzi, math.drill, english.words */
  studySection?: string;
  contentCard?: ContentCard;
  sideEffect?: SideEffect;
}

export interface UserMessage {
  text: string;
  channel: "web" | "wechat_mp" | "wechat_mini";
}

export interface SessionContext {
  channel: UserMessage["channel"];
  lastStudySection?: string;
  mathDrillActive?: boolean;
  /** 最近一次可朗读的正文（「朗读」「读一下」用） */
  lastSpeakableText?: string;
}

export interface RuleEntry {
  skillId: string;
  keywords: string[];
  response: AgentResponse;
}

export interface AsyncSkill {
  id: string;
  keywords: string[];
  execute: (text: string, normalized: string, ctx: SessionContext) => Promise<AgentResponse>;
}
