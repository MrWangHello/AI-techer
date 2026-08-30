import allWords from "@/data/words.json";
import { lookupWord } from "@/lib/providers/iciba";
import type { AgentResponse } from "@/lib/core/types";
import { withStudyNav } from "@/lib/skills/nav-skills";

interface WordEntry {
  en: string;
  zh: string;
  sentence?: string;
}

const WORDS = allWords as WordEntry[];

/** 常用词补充（words.json 未覆盖） */
const EXTRA_ZH_EN: Record<string, string> = {
  书本: "book",
  书: "book",
  电脑: "computer",
  手机: "phone",
  桌子: "desk",
  椅子: "chair",
  学校: "school",
  老师: "teacher",
  学生: "student",
  朋友: "friend",
  妈妈: "mother",
  爸爸: "father",
  水: "water",
  火: "fire",
  树: "tree",
  花: "flower",
  狗: "dog",
  鸟: "bird",
};

function findInWordBank(zh: string): WordEntry | null {
  const exact = WORDS.find((w) => w.zh === zh);
  if (exact) return exact;
  const contains = WORDS.find((w) => zh.includes(w.zh) || w.zh.includes(zh));
  return contains ?? null;
}

const LOOKUP_STOPWORDS = new Set([
  "数学",
  "英语",
  "语文",
  "汉字",
  "拼音",
  "口算",
  "故事",
  "古诗",
  "笑话",
  "天气",
  "帮助",
  "学习",
]);

export function extractChineseQuery(text: string): string | null {
  const cleaned = text.replace(/[？?。！!，,\s]/g, "");
  const patterns = [
    /(.+?)用英语怎么说/,
    /(.+?)用英文怎么说/,
    /(.+?)英语怎么说/,
    /(.+?)英文怎么说/,
    /(.+?)的英文是什么/,
    /(.+?)的英文/,
    /(.+?)翻译成英文/,
    /(.+?)翻译怎么说/,
    /^([\u4e00-\u9fff]{1,4})怎么说$/,
  ];
  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m?.[1]) {
      let q = m[1]
        .replace(/^(请问|那个|这个|一下|我想知道|我是|书本是)/, "")
        .trim();
      if (!/[\u4e00-\u9fff]/.test(q) || q.length < 1 || q.length > 6) continue;
      if (LOOKUP_STOPWORDS.has(q)) continue;
      return q;
    }
  }
  return null;
}

export function looksLikeChineseLookup(text: string): boolean {
  return extractChineseQuery(text) !== null;
}

export async function tryChineseToEnglishLookup(text: string): Promise<AgentResponse | null> {
  const zh = extractChineseQuery(text);
  if (!zh) return null;

  const fromBank = findInWordBank(zh);
  if (fromBank) {
    return withStudyNav(
      {
        intent: "zh_to_en",
        emotion: "happy",
        action: "study",
        reply: `「${zh}」的英文是 ${fromBank.en}。例句：${fromBank.sentence ?? ""}`,
        contentCard: {
          type: "english-sentence",
          payload: { en: fromBank.en, zh, emoji: "📖" },
        },
      },
      "english.words"
    );
  }

  const extra = EXTRA_ZH_EN[zh];
  if (extra) {
    return withStudyNav(
      {
        intent: "zh_to_en",
        emotion: "happy",
        action: "study",
        reply: `「${zh}」的英文是 ${extra}。`,
        contentCard: {
          type: "english-sentence",
          payload: { en: extra, zh, emoji: "📖" },
        },
      },
      "english.words"
    );
  }

  try {
    const mean = await lookupWord(zh);
    if (mean) {
      return withStudyNav(
        {
          intent: "zh_to_en",
          emotion: "thinking",
          action: "study",
          reply: `查到了：${zh} → ${mean}`,
        },
        "english.words"
      );
    }
  } catch (_) {}

  return withStudyNav(
    {
      intent: "zh_to_en_miss",
      emotion: "thinking",
      action: "study",
      reply: `我还没收录「${zh}」的英文。你可以说「apple 什么意思」查英文单词，或说「每日英语」学句子。`,
    },
    "english.words"
  );
}
