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
import { matchShortcutContent, enrichNavWithContent, matchReadAloud } from "@/lib/skills/nav-content";
import { drillActiveFallback, buildDrillExitResponse } from "@/lib/skills/drill-hint";
import { matchWordProblemAnswer } from "@/lib/skills/word-problem-skills";
import { lookupDictionaryLocal, looksLikeChineseLookup } from "@/lib/providers/local-dictionary";
import { fallbackSkill } from "@/lib/skills/fallback";
import { getSession, updateSession } from "@/lib/session-store";
import { isDrillActive } from "@/lib/math/drill-state";
import { clearWordProblem } from "@/lib/math/word-problem-state";

const ALL_RULES = [...NAV_SKILLS, ...CHINESE_CONTENT_SKILLS, ...RULE_SKILLS];

const NAV_WITH_CONTENT = new Set([
  "nav.reading",
  "nav.chinese",
  "nav.hanzi",
  "nav.pinyin",
  "nav.sentence",
  "nav.english.sentence",
  "nav.math",
  "math.drill.start",
]);

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

const DRILL_EXIT = /^(停止|退出|结束|暂停|不要了)(口算|练习)?$|^不做了$|^停止口算$/;

function trackResponse(response: AgentResponse): AgentResponse {
  if (response.contentCard && response.reply) {
    updateSession({ lastSpeakableText: response.reply });
  }
  if (response.studySection) {
    updateSession({ lastStudySection: response.studySection });
    if (response.studySection !== "math.word-problem") {
      clearWordProblem();
    }
  }
  if (response.navigate && response.navigate !== "study") {
    clearWordProblem();
  }
  return response;
}

function matchFuzzyRefresh(normalized: string, ctx: SessionContext): AgentResponse | null {
  if (/换一首|再来一首|下一首/.test(normalized)) return null;
  if (!/换一[篇个批组]|再来一[个]|下一批|换一个|再来一个/.test(normalized)) return null;

  const section = ctx.lastStudySection ?? "";

  if (/诗|古诗|词/.test(normalized) || section.includes("poetry")) return null;
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

function enrichRuleHit(skillId: string, response: AgentResponse): AgentResponse {
  if (skillId === "math.drill.start" || response.sideEffect === "math.drill.start") {
    return buildMathDrillStartResponse();
  }
  if (NAV_WITH_CONTENT.has(skillId)) {
    return enrichNavWithContent(skillId, response);
  }
  if (RESOLVABLE_NAV.has(skillId)) {
    return resolveChineseContent(skillId) ?? response;
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
  return skill.execute(text, normalized, ctx);
}

/** 口算进行中：除答题/退出/帮助外，不跑导航与查词，避免「半天没反应」 */
function handleDrillMode(normalized: string): AgentResponse | null {
  if (!isDrillActive()) return null;

  if (DRILL_EXIT.test(normalized)) {
    return buildDrillExitResponse();
  }

  if (/帮助|help|指令|功能|怎么用/.test(normalized)) {
    const help = RULE_SKILLS.find((r) => r.skillId === "help.list");
    if (help) return { ...help.response };
  }

  return drillActiveFallback();
}

export async function handleUserMessage(
  msg: UserMessage,
  ctx: SessionContext = getSession()
): Promise<AgentResponse> {
  const text = applySttCorrections(msg.text.trim());
  if (!text) {
    const drillHint = handleDrillMode("");
    return trackResponse(drillHint ?? fallbackSkill());
  }

  const normalized = normalizeInput(text);
  const session = { ...getSession(), ...ctx };

  const mathCalc = matchMathCalc(text, normalized);
  if (mathCalc) return trackResponse(mathCalc);

  const drillAnswer = matchMathDrillAnswer(text, session);
  if (drillAnswer) return trackResponse(drillAnswer);

  const drillBlock = handleDrillMode(normalized);
  if (drillBlock) return trackResponse(drillBlock);

  const wordProblemAnswer = matchWordProblemAnswer(text, session);
  if (wordProblemAnswer) return trackResponse(wordProblemAnswer);

  const readAloud = matchReadAloud(normalized, session);
  if (readAloud) return trackResponse(readAloud);

  const fuzzy = matchFuzzyRefresh(normalized, session);
  if (fuzzy) return trackResponse(fuzzy);

  const shortcut = matchShortcutContent(normalized);
  if (shortcut) return trackResponse(shortcut);

  if (looksLikeChineseLookup(text)) {
    const local = lookupDictionaryLocal(text);
    if (local) return trackResponse(local);
  }

  const ruleHit = matchRuleSkills(normalized);
  if (ruleHit) return trackResponse(enrichRuleHit(ruleHit.skillId, ruleHit.response));

  const dict = lookupDictionaryLocal(text);
  if (dict) return trackResponse(dict);

  const asyncId = matchAsyncSkillId(normalized, text);
  if (asyncId && asyncId !== "english.lookup") {
    const result = await executeAsyncSkill(asyncId, text, normalized, session);
    return trackResponse(result);
  }

  const lookup = await tryEnglishLookup(text);
  if (lookup) {
    return trackResponse({ ...lookup, navigate: "study", studySection: "english.words" });
  }

  return trackResponse(fallbackSkill());
}

export function processUserInput(input: string): AgentResponse {
  const normalized = normalizeInput(input);
  const shortcut = matchShortcutContent(normalized);
  if (shortcut) return trackResponse(shortcut);
  const ruleHit = matchRuleSkills(normalized);
  if (ruleHit) return trackResponse(enrichRuleHit(ruleHit.skillId, ruleHit.response));
  return trackResponse(fallbackSkill());
}

export type { AgentResponse, TabTarget } from "@/lib/core/types";
