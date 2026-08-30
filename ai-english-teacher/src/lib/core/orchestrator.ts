import type { AgentResponse, SessionContext, UserMessage } from "@/lib/core/types";
import { matchKeywords, normalizeInput, applySttCorrections } from "@/lib/core/normalize";
import { RULE_SKILLS } from "@/lib/skills/rule-skills";
import { ASYNC_SKILLS, tryEnglishLookup } from "@/lib/skills/content-skills";
import { fallbackSkill } from "@/lib/skills/fallback";

function matchFuzzyRefresh(normalized: string): AgentResponse | null {
  // 「换一首」走 poetry Skill，不归入换词
  if (/换一首|再来一首|下一首/.test(normalized)) return null;
  if (!/换一[篇个批组]|再来一[篇个]|下一批/.test(normalized)) return null;
  if (/诗|古诗|词|笑话|故事|英语|单词/.test(normalized)) return null;

  const refresh = RULE_SKILLS.find((r) => r.skillId === "word.refresh");
  if (!refresh) return null;
  return { ...refresh.response };
}

function matchRuleSkills(normalized: string): AgentResponse | null {
  for (const rule of RULE_SKILLS) {
    if (matchKeywords(normalized, rule.keywords)) {
      return { ...rule.response, intent: rule.response.intent || rule.skillId };
    }
  }
  return matchFuzzyRefresh(normalized);
}

function matchAsyncSkillId(normalized: string, raw: string): string | null {
  for (const skill of ASYNC_SKILLS) {
    if (matchKeywords(normalized, skill.keywords)) {
      return skill.id;
    }
  }
  // 天气：「冷」「热」单独出现时不走 API（避免误触），需含天气语义
  if (/天气|weather|几度|气温/.test(normalized)) return "weather.query";
  if (/^[a-zA-Z\s-]{2,40}$/.test(raw.trim())) return "english.lookup";
  return null;
}

async function executeAsyncSkill(skillId: string, text: string, normalized: string): Promise<AgentResponse> {
  const skill = ASYNC_SKILLS.find((s) => s.id === skillId);
  if (!skill) return fallbackSkill();
  return skill.execute(text, normalized);
}

/**
 * Mock Agent 统一入口 — 后续只替换这里的「意图识别」层即可接 LLM
 */
export async function handleUserMessage(
  msg: UserMessage,
  _ctx: SessionContext = { channel: msg.channel }
): Promise<AgentResponse> {
  const text = applySttCorrections(msg.text.trim());
  if (!text) return fallbackSkill();

  const normalized = normalizeInput(text);

  const ruleHit = matchRuleSkills(normalized);
  if (ruleHit) return ruleHit;

  const asyncId = matchAsyncSkillId(normalized, text);
  if (asyncId) {
    return executeAsyncSkill(asyncId, text, normalized);
  }

  const lookup = await tryEnglishLookup(text);
  if (lookup) return lookup;

  return fallbackSkill();
}

/** 同步兼容（仅规则，不调 API）— 供旧调用方 */
export function processUserInput(input: string): AgentResponse {
  const normalized = normalizeInput(input);
  const ruleHit = matchRuleSkills(normalized);
  if (ruleHit) return ruleHit;
  return fallbackSkill();
}

export type { AgentResponse, TabTarget } from "@/lib/core/types";
