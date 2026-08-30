import type { ContentCard } from "@/lib/core/types";
import type { SpeakIconLang } from "@/lib/speak-lang";

export interface SpeakableField {
  key: string;
  text: string;
  lang?: SpeakIconLang;
}

function asRecord(payload?: Record<string, unknown>) {
  return payload ?? {};
}

function itemOf<T>(p: Record<string, unknown>): T | undefined {
  return p.item as T | undefined;
}

/** 按字段拆开，供逐段喇叭使用。 */
export function getSpeakableFields(card: ContentCard): SpeakableField[] {
  const p = asRecord(card.payload);

  switch (card.type) {
    case "pinyin": {
      const item = itemOf<{ display: string; tip?: string; example?: string }>(p);
      if (!item) return [];
      return [
        { key: "display", text: item.display, lang: "zh" },
        ...(item.tip ? [{ key: "tip", text: item.tip, lang: "zh" as const }] : []),
        ...(item.example ? [{ key: "example", text: item.example, lang: "zh" as const }] : []),
      ];
    }
    case "hanzi": {
      const item = itemOf<{ char: string; pinyin: string; words?: string[]; sentence?: string }>(p);
      if (!item) return [];
      return [
        { key: "char", text: `${item.char}，${item.pinyin}`, lang: "zh" },
        ...(item.words?.length
          ? [{ key: "words", text: item.words.join("，"), lang: "zh" as const }]
          : []),
        ...(item.sentence ? [{ key: "sentence", text: item.sentence, lang: "zh" as const }] : []),
      ];
    }
    case "sentence": {
      const item = itemOf<{ text: string; hint?: string }>(p);
      if (!item) return [];
      return [
        { key: "text", text: item.text, lang: "zh" },
        ...(item.hint ? [{ key: "hint", text: item.hint, lang: "zh" as const }] : []),
      ];
    }
    case "idiom": {
      const item = itemOf<{ word: string; pinyin?: string; meaning?: string; example?: string }>(p);
      if (!item) return [];
      return [
        { key: "word", text: item.pinyin ? `${item.word}，${item.pinyin}` : item.word, lang: "zh" },
        ...(item.meaning ? [{ key: "meaning", text: item.meaning, lang: "zh" as const }] : []),
        ...(item.example ? [{ key: "example", text: item.example, lang: "zh" as const }] : []),
      ];
    }
    case "english-sentence": {
      const item = itemOf<{ en: string; zh: string }>(p);
      if (!item) return [];
      return [
        { key: "en", text: item.en, lang: "en" },
        { key: "zh", text: item.zh, lang: "zh" },
      ];
    }
    case "word-problem": {
      const item = itemOf<{ question: string; explain?: string }>(p);
      if (!item) return [];
      return [
        { key: "question", text: item.question, lang: "zh" },
        ...(item.explain ? [{ key: "explain", text: item.explain, lang: "zh" as const }] : []),
      ];
    }
    case "poetry": {
      const title = (p.title as string | undefined) ?? "";
      const author = (p.author as string | undefined) ?? "";
      const content = (p.content as string | undefined) ?? "";
      return [
        ...(title ? [{ key: "title", text: `《${title}》`, lang: "zh" as const }] : []),
        ...(author ? [{ key: "author", text: author, lang: "zh" as const }] : []),
        ...(content
          ? [{ key: "content", text: content.replace(/\n/g, "，"), lang: "zh" as const }]
          : []),
      ];
    }
    case "math-drill": {
      const q = p.question as { scenario?: string; a?: number; op?: string; b?: number } | undefined;
      if (!q) return [];
      return [
        ...(q.scenario ? [{ key: "scenario", text: q.scenario, lang: "zh" as const }] : []),
        {
          key: "expr",
          text: `${q.a ?? ""} ${q.op === "-" ? "减" : "加"} ${q.b ?? ""} 等于多少`,
          lang: "zh",
        },
      ];
    }
    case "text":
    default: {
      const title = (p.title as string | undefined) ?? "";
      const text = (p.text as string) || (p.en as string) || (p.zh as string) || "";
      return [
        ...(title ? [{ key: "title", text: title, lang: "auto" as const }] : []),
        ...(text ? [{ key: "text", text, lang: "auto" as const }] : []),
      ];
    }
  }
}

/** 从内容卡片提取可朗读文本（供 🔊 按钮与「朗读」指令） */
export function getSpeakableFromCard(card: ContentCard): string {
  const fields = getSpeakableFields(card);
  if (fields.length) return fields.map((f) => f.text).filter(Boolean).join("。");

  const p = card.payload as Record<string, unknown> | undefined;
  if (!p) return "";
  return ((p.text as string) || (p.en as string) || (p.zh as string) || "").trim();
}
