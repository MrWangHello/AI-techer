/**
 * 导航类意图 → 自动加载内容并用可朗读文案作为 reply
 */
import type { AgentResponse, SessionContext } from "@/lib/core/types";
import { withStudyNav } from "@/lib/skills/nav-skills";
import { pickRandomChineseStory, pickRandomJoke } from "@/lib/providers/local-content";
import { pickRandomShortPoem } from "@/lib/providers/poetry";
import { resolveChineseContent } from "@/lib/skills/chinese-skills";
import { buildMathDrillStartResponse } from "@/lib/skills/math-skills";

const NAV_CONTENT_HANDLERS: Record<string, () => AgentResponse> = {
  "nav.reading": () => {
    const s = pickRandomChineseStory();
    const spoken = `《${s.title}》${s.text}`;
    return withStudyNav(
      {
        intent: "story",
        emotion: "happy",
        action: "study",
        reply: spoken,
        contentCard: { type: "text", payload: { text: s.text, title: `📖 ${s.title}` } },
      },
      "reading.story"
    );
  },
  "nav.chinese": () => resolveChineseContent("nav.hanzi")!,
  "nav.hanzi": () => resolveChineseContent("nav.hanzi")!,
  "nav.pinyin": () => resolveChineseContent("nav.pinyin")!,
  "nav.sentence": () => resolveChineseContent("nav.sentence")!,
  "nav.english.sentence": () => resolveChineseContent("nav.english.sentence")!,
  "nav.math": () => buildMathDrillStartResponse(),
  "math.drill.start": () => buildMathDrillStartResponse(),
};

export function enrichNavWithContent(skillId: string, response: AgentResponse): AgentResponse {
  const handler = NAV_CONTENT_HANDLERS[skillId];
  if (handler) return handler();
  return response;
}

/** 单字触发词 → 直接出内容（避免只导航不朗读） */
export function matchShortcutContent(normalized: string): AgentResponse | null {
  if (/^(故事|讲故事|听故事|来个故事|童话|读故事)$/.test(normalized)) {
    return NAV_CONTENT_HANDLERS["nav.reading"]();
  }
  if (/^(笑话|讲笑话|听笑话)$/.test(normalized)) {
    const text = pickRandomJoke();
    return withStudyNav(
      {
        intent: "joke",
        emotion: "happy",
        action: "study",
        reply: text,
        contentCard: { type: "text", payload: { text, title: "😄 笑话" } },
      },
      "reading.joke"
    );
  }
  if (/^(古诗|背古诗|来首诗|读古诗|诗词|念古诗)$/.test(normalized)) {
    const p = pickRandomShortPoem();
    const spoken = `《${p.title}》${p.author}：${p.content.replace(/\n/g, "，")}`;
    return withStudyNav(
      {
        intent: "poetry",
        emotion: "thinking",
        action: "study",
        reply: spoken,
        contentCard: { type: "poetry", payload: { ...p } },
      },
      "chinese.poetry"
    );
  }
  return null;
}

/** 朗读当前屏幕内容 */
export function matchReadAloud(normalized: string, ctx: SessionContext): AgentResponse | null {
  if (!/^(朗读|读一下|读给我听|念一下|再读一遍|读出来)$/.test(normalized)) return null;

  const text = ctx.lastSpeakableText;
  if (!text) {
    return {
      intent: "read_aloud_empty",
      emotion: "thinking",
      action: "study",
      reply: "屏幕上还没有可以朗读的内容。先说「讲故事」「背古诗」或「每日英语」，再说「朗读」~",
      navigate: "study",
      studySection: ctx.lastStudySection ?? "english.words",
    };
  }

  return {
    intent: "read_aloud",
    emotion: "happy",
    action: "study",
    reply: text,
    navigate: "study",
    studySection: ctx.lastStudySection,
  };
}
