import type { AgentResponse, SessionContext, UserMessage } from "@/lib/core/types";
import { matchKeywords, normalizeInput, applySttCorrections } from "@/lib/core/normalize";
import { RULE_SKILLS } from "@/lib/skills/rule-skills";
import { NAV_SKILLS } from "@/lib/skills/nav-skills";
import { ASYNC_SKILLS, tryEnglishLookup } from "@/lib/skills/content-skills";
import { CHINESE_CONTENT_SKILLS, resolveChineseContent } from "@/lib/skills/chinese-skills";
import {
  matchMathCalc,
  matchMathDrillAnswer,
  buildMathDrillStartResponse,
} from "@/lib/skills/math-skills";
import { fallbackSkill } from "@/lib/skills/fallback";
import { getSession, updateSession } from "@/lib/session-store";

const ALL_RULES = [...NAV_SKILLS, ...CHINESE_CONTENT_SKILLS, ...RULE_SKILLS];

function matchFuzzyRefresh(normalized: string, ctx: SessionContext): AgentResponse | null {
  if (/换一首|再来一首|下一首/.test(normalized)) return null;
  if (!/换一[篇个批组]|再来一[个]|下一批|换一个|再来一个/.test(normalized)) return null;

  const section = ctx.lastStudySection ?? "";

  if (/诗|古诗|词/.test(normalized) || section.includes("poetry")) {
    return null; // poetry async skill
  }
  if (/笑话/.test(normalized) || section === "reading.joke") return null;
  if (/故事/.test(normalized) || section === "reading.story") return null;
  if (/成语/.test(normalized) || section === "chinese.idiom") {
    return resolveChineseContent("idiom.random");
  }
  if (/应用题/.test(normalized) || section === "math.word-problem") {
    return resolveChineseContent("word-problem.random");
  }
  if (/汉字|认字/.test(normalized) || section === "chinese.hanzi") {
    return resolveChineseContent("nav.hanzi");
  }
  if (/拼音/.test(normalized) || section === "chinese.pinyin") {
    return resolveChineseContent("nav.pinyin");
  }
  if (/句子/.test(normalized) || section === "chinese.sentence") {
    return resolveChineseContent("nav.sentence");
  }
  if (/口算|数学/.test(normalized) || section === "math.drill") {
    return buildMathDrillStartResponse();
  }
  if (/英语句子/.test(normalized) || section === "english.sentence") {
    return resolveChineseContent("nav.english.sentence");
  }

  const refresh = RULE_SKILLS.find((r) => r.skillId === "word.refresh");
  if (!refresh) return null;
  return { ...refresh.response };
}

function matchRuleSkills(normalized: string): { skillId: string; response: AgentResponse } | null {
  for (const rule of ALL_RULES) {
    if (matchKeywords(normalized, rule.keywords)) {
      return {
        skillId: rule.skillId,
        response: { ...rule.response, intent: rule.response.intent || rule.skillId },
      };
    }
  }
  return null;
}

const RESOLVABLE_NAV = new Set([
  "nav.chinese",
  "nav.pinyin",
  "nav.hanzi",
  "nav.sentence",
  "nav.english.sentence",
  "idiom.random",
  "word-problem.random",
  "chinese.pinyin.show",
]);

function enrichRuleHit(skillId: string, response: AgentResponse): AgentResponse {
  if (skillId === "math.drill.start" || response.sideEffect === "math.drill.start") {
    return buildMathDrillStartResponse();
  }
  if (RESOLVABLE_NAV.has(skillId)) {
    return resolveChineseContent(skillId) ?? response;
  }
  if (response.studySection) {
    updateSession({ lastStudySection: response.studySection });
  }
  return response;
}

function matchAsyncSkillId(normalized: string, raw: string): string | null {
  for (const skill of ASYNC_SKILLS) {
    if (matchKeywords(normalized, skill.keywords)) {
      return skill.id;
    }
  }
  if (/天气|weather|几度|气温/.test(normalized)) return "weather.query";
  if (/^[a-zA-Z\s-]{2,40}$/.test(raw.trim())) return "english.lookup";
  return null;
}

async function executeAsyncSkill(
  skillId: string,
  text: string,
  normalized: string,
  ctx: SessionContext
): Promise<AgentResponse> {
  const skill = ASYNC_SKILLS.find((s) => s.id === skillId);
  if (!skill) return fallbackSkill();
  const result = await skill.execute(text, normalized, ctx);
  if (result.studySection) {
    updateSession({ lastStudySection: result.studySection });
  }
  return result;
}

/**
 * Mock Agent 统一入口 — 后续只替换这里的「意图识别」层即可接 LLM
 */
export async function handleUserMessage(
  msg: UserMessage,
  ctx: SessionContext = getSession()
): Promise<AgentResponse> {
  const text = applySttCorrections(msg.text.trim());
  if (!text) return fallbackSkill();

  const normalized = normalizeInput(text);
  const session = { ...getSession(), ...ctx };

  const mathCalc = matchMathCalc(text, normalized);
  if (mathCalc) return mathCalc;

  const drillAnswer = matchMathDrillAnswer(text, session);
  if (drillAnswer) return drillAnswer;

  const fuzzy = matchFuzzyRefresh(normalized, session);
  if (fuzzy) return fuzzy;

  const ruleHit = matchRuleSkills(normalized);
  if (ruleHit) return enrichRuleHit(ruleHit.skillId, ruleHit.response);

  const asyncId = matchAsyncSkillId(normalized, text);
  if (asyncId) {
    return executeAsyncSkill(asyncId, text, normalized, session);
  }

  const lookup = await tryEnglishLookup(text);
  if (lookup) {
    updateSession({ lastStudySection: "english.words" });
    return { ...lookup, navigate: "study", studySection: "english.words" };
  }

  return fallbackSkill();
}

/** 同步兼容（仅规则，不调 API） */
export function processUserInput(input: string): AgentResponse {
  const normalized = normalizeInput(input);
  const ruleHit = matchRuleSkills(normalized);
  if (ruleHit) return enrichRuleHit(ruleHit.skillId, ruleHit.response);
  return fallbackSkill();
}

export type { AgentResponse, TabTarget } from "@/lib/core/types";
