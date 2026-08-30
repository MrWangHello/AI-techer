import type { AgentResponse, RuleEntry } from "@/lib/core/types";
import { matchKeywords } from "@/lib/core/normalize";
import {
  pickRandomPinyin,
  pickRandomHanzi,
  pickRandomSentence,
  pickRandomIdiom,
  pickRandomWordProblem,
  pickRandomEnglishSentence,
  formatPinyinReply,
  formatHanziReply,
  formatSentenceReply,
  formatIdiomReply,
  formatWordProblemReply,
  formatEnglishSentenceReply,
} from "@/lib/providers/chinese-content";
import { withStudyNav } from "@/lib/skills/nav-skills";
import { updateSession } from "@/lib/session-store";
import { setCurrentWordProblem } from "@/lib/math/word-problem-state";

function card(
  type: NonNullable<AgentResponse["contentCard"]>["type"],
  payload: Record<string, unknown>
): AgentResponse["contentCard"] {
  return { type, payload };
}

/** 内置 JSON 内容 Skill（同步，零 API） */
export const CHINESE_CONTENT_SKILLS: RuleEntry[] = [
  {
    skillId: "chinese.pinyin.show",
    keywords: ["学韵母", "单韵母", "读a", "拼音卡"],
    response: withStudyNav(
      { intent: "pinyin", emotion: "happy", action: "study", reply: "" },
      "chinese.pinyin"
    ),
  },
  {
    skillId: "idiom.random",
    keywords: ["成语", "讲成语", "来个成语", "成语故事"],
    response: withStudyNav(
      { intent: "idiom", emotion: "thinking", action: "study", reply: "" },
      "chinese.idiom"
    ),
  },
  {
    skillId: "word-problem.random",
    keywords: ["应用题", "文字题", "数学应用题"],
    response: withStudyNav(
      { intent: "word_problem", emotion: "thinking", action: "study", reply: "" },
      "math.word-problem"
    ),
  },
];

export function resolveChineseContent(skillId: string): AgentResponse | null {
  switch (skillId) {
    case "nav.pinyin":
    case "chinese.pinyin.show": {
      const p = pickRandomPinyin();
      updateSession({ lastStudySection: "chinese.pinyin" });
      return withStudyNav(
        {
          intent: "pinyin",
          emotion: "happy",
          action: "study",
          reply: formatPinyinReply(p),
          contentCard: card("pinyin", { item: p }),
        },
        "chinese.pinyin"
      );
    }
    case "nav.hanzi": {
      const h = pickRandomHanzi();
      updateSession({ lastStudySection: "chinese.hanzi" });
      return withStudyNav(
        {
          intent: "hanzi",
          emotion: "happy",
          action: "study",
          reply: formatHanziReply(h),
          contentCard: card("hanzi", { item: h }),
        },
        "chinese.hanzi"
      );
    }
    case "nav.sentence": {
      const s = pickRandomSentence();
      updateSession({ lastStudySection: "chinese.sentence" });
      return withStudyNav(
        {
          intent: "sentence",
          emotion: "happy",
          action: "study",
          reply: formatSentenceReply(s),
          contentCard: card("sentence", { item: s }),
        },
        "chinese.sentence"
      );
    }
    case "idiom.random": {
      const i = pickRandomIdiom();
      updateSession({ lastStudySection: "chinese.idiom" });
      return withStudyNav(
        {
          intent: "idiom",
          emotion: "thinking",
          action: "study",
          reply: formatIdiomReply(i),
          contentCard: card("idiom", { item: i }),
        },
        "chinese.idiom"
      );
    }
    case "word-problem.random": {
      const w = pickRandomWordProblem();
      setCurrentWordProblem(w);
      updateSession({ lastStudySection: "math.word-problem" });
      return withStudyNav(
        {
          intent: "word_problem",
          emotion: "thinking",
          action: "study",
          reply: formatWordProblemReply(w),
          contentCard: card("word-problem", { item: w }),
        },
        "math.word-problem"
      );
    }
    case "nav.english.sentence": {
      const e = pickRandomEnglishSentence();
      updateSession({ lastStudySection: "english.sentence" });
      return withStudyNav(
        {
          intent: "english_sentence",
          emotion: "happy",
          action: "study",
          reply: formatEnglishSentenceReply(e),
          contentCard: card("english-sentence", { item: e }),
        },
        "english.sentence"
      );
    }
    case "nav.chinese": {
      return resolveChineseContent("nav.hanzi");
    }
    default:
      return null;
  }
}

export function matchChineseContent(normalized: string): AgentResponse | null {
  for (const rule of CHINESE_CONTENT_SKILLS) {
    if (matchKeywords(normalized, rule.keywords)) {
      return resolveChineseContent(rule.skillId);
    }
  }
  return null;
}
