import allWords from "@/data/words.json";
import type { AgentResponse } from "@/lib/core/types";
import { withStudyNav } from "@/lib/skills/nav-skills";

interface WordEntry {
  en: string;
  zh: string;
  sentence?: string;
}

const WORDS = allWords as WordEntry[];

/** 一年级常用中译英补充（words.json 未覆盖的短词） */
const EXTRA_ZH_EN: Record<string, { en: string; sentence?: string }> = {
  书本: { en: "book", sentence: "This is my book." },
  书: { en: "book", sentence: "This is my book." },
  电脑: { en: "computer" },
  手机: { en: "phone" },
  桌子: { en: "desk" },
  椅子: { en: "chair" },
  学校: { en: "school" },
  老师: { en: "teacher" },
  学生: { en: "student" },
  朋友: { en: "friend" },
  妈妈: { en: "mother" },
  爸爸: { en: "father" },
  水: { en: "water" },
  火: { en: "fire" },
  树: { en: "tree" },
  花: { en: "flower" },
  狗: { en: "dog" },
  鸟: { en: "bird" },
  猫: { en: "cat" },
  苹果: { en: "apple" },
  香蕉: { en: "banana" },
};

const EN_INDEX = new Map<string, WordEntry>();
const ZH_INDEX = new Map<string, WordEntry>();

for (const w of WORDS) {
  EN_INDEX.set(w.en.toLowerCase(), w);
  if (w.zh) ZH_INDEX.set(w.zh, w);
}
for (const [zh, extra] of Object.entries(EXTRA_ZH_EN)) {
  if (!ZH_INDEX.has(zh)) {
    ZH_INDEX.set(zh, { en: extra.en, zh, sentence: extra.sentence });
  }
  if (!EN_INDEX.has(extra.en.toLowerCase())) {
    EN_INDEX.set(extra.en.toLowerCase(), { en: extra.en, zh, sentence: extra.sentence });
  }
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

export function lookupLocalEn(en: string): WordEntry | null {
  const key = en.trim().toLowerCase();
  if (!key) return null;
  return EN_INDEX.get(key) ?? null;
}

export function lookupLocalZh(zh: string): WordEntry | null {
  const key = zh.trim();
  if (!key) return null;
  const exact = ZH_INDEX.get(key);
  if (exact) return exact;
  for (const [k, w] of ZH_INDEX) {
    if (key.includes(k) || k.includes(key)) return w;
  }
  return null;
}

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
      const q = m[1].replace(/^(请问|那个|这个|一下|我想知道|我是|书本是)/, "").trim();
      if (!/[\u4e00-\u9fff]/.test(q) || q.length < 1 || q.length > 6) continue;
      if (LOOKUP_STOPWORDS.has(q)) continue;
      return q;
    }
  }
  return null;
}

export function extractEnglishQuery(text: string): string | null {
  const m = text.match(/[a-zA-Z]{2,20}/);
  return m?.[0]?.toLowerCase() ?? null;
}

export function looksLikeChineseLookup(text: string): boolean {
  return extractChineseQuery(text) !== null;
}

export function looksLikeEnglishLookup(text: string): boolean {
  if (/^[a-zA-Z\s-]{2,40}$/.test(text.trim())) return true;
  return /什么意思|翻译|释义|查单词|词典/.test(text) && !!extractEnglishQuery(text);
}

function hitResponse(entry: WordEntry, query: string): AgentResponse {
  const sentence = entry.sentence ? `例句：${entry.sentence}` : "";
  return withStudyNav(
    {
      intent: "dict_hit",
      emotion: "happy",
      action: "study",
      reply: `「${query}」→ ${entry.en}，${entry.zh}。${sentence}`.trim(),
      contentCard: {
        type: "english-sentence",
        payload: {
          item: { en: entry.en, zh: entry.zh, emoji: "📖" },
        },
      },
    },
    "english.words"
  );
}

function missResponse(query: string): AgentResponse {
  return withStudyNav(
    {
      intent: "dict_miss",
      emotion: "thinking",
      action: "study",
      reply: `词库里还没有「${query}」。试试「apple 什么意思」或「书本用英语怎么说」。`,
    },
    "english.words"
  );
}

/** 纯本地查词：不发起任何网络请求 */
export function lookupDictionaryLocal(text: string): AgentResponse | null {
  const zh = extractChineseQuery(text);
  if (zh) {
    const hit = lookupLocalZh(zh);
    return hit ? hitResponse(hit, zh) : missResponse(zh);
  }

  if (!looksLikeEnglishLookup(text) && !/^[a-zA-Z\s-]{2,40}$/.test(text.trim())) {
    return null;
  }

  const en = extractEnglishQuery(text);
  if (!en) return null;

  const hit = lookupLocalEn(en);
  return hit ? hitResponse(hit, en) : missResponse(en);
}
