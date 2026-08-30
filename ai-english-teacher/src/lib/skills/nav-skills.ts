import type { AgentResponse } from "@/lib/core/types";
import type { RuleEntry } from "@/lib/core/types";

function nav(
  studySection: string,
  reply: string,
  emotion: AgentResponse["emotion"] = "happy",
  extra: Partial<AgentResponse> = {}
): AgentResponse {
  return {
    intent: `nav_${studySection.replace(/\./g, "_")}`,
    emotion,
    action: "study",
    reply,
    navigate: "study",
    studySection,
    ...extra,
  };
}

/** 学科与子模块导航（同步规则） */
export const NAV_SKILLS: RuleEntry[] = [
  {
    skillId: "nav.chinese",
    keywords: ["语文", "学语文", "国语", "中文"],
    response: nav("chinese.hanzi", "好呀！我们来学汉字~"),
  },
  {
    skillId: "nav.pinyin",
    keywords: ["拼音", "学拼音", "读拼音", "韵母", "声母"],
    response: nav("chinese.pinyin", "一起来学拼音吧！"),
  },
  {
    skillId: "nav.hanzi",
    keywords: ["汉字", "认字", "识字", "学汉字", "认汉字"],
    response: nav("chinese.hanzi", "好！我们来认字~"),
  },
  {
    skillId: "nav.sentence",
    keywords: ["句子", "读句子", "学句子", "造句"],
    response: nav("chinese.sentence", "来读句子吧！"),
  },
  {
    skillId: "nav.english",
    keywords: ["英语", "学英语", "英文"],
    response: nav("english.words", "好的！来学英语单词~"),
  },
  {
    skillId: "nav.english.sentence",
    keywords: ["英语句子", "英文句子", "学句子英语"],
    response: nav("english.sentence", "来学英语句子吧！"),
  },
  {
    skillId: "nav.math",
    keywords: ["数学", "算数", "算术"],
    response: nav("math.drill", "数学时间！我们来口算~", "thinking", {
      sideEffect: "math.drill.start",
    }),
  },
  {
    skillId: "nav.reading",
    keywords: ["阅读", "看书", "读故事"],
    response: nav("reading.story", "来看故事吧！"),
  },
  {
    skillId: "nav.explore",
    keywords: ["探索", "查一查", "百科探索"],
    response: nav("explore.weather", "探索模式！你可以问天气或百科~"),
  },
  {
    skillId: "math.drill.start",
    keywords: ["口算", "算一算", "练口算", "口算练习", "出题", "数学题口算"],
    response: nav("math.drill", "口算开始！准备好哦~", "happy", {
      sideEffect: "math.drill.start",
    }),
  },
];

export function withStudyNav(response: AgentResponse, studySection: string): AgentResponse {
  return {
    ...response,
    navigate: "study",
    studySection,
    action: response.action === "none" ? "study" : response.action,
  };
}
