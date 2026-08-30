import type { ContentCard } from "@/lib/core/types";

/** 从内容卡片提取可朗读文本（供 🔊 按钮与「朗读」指令） */
export function getSpeakableFromCard(card: ContentCard): string {
  const p = card.payload as Record<string, unknown> | undefined;
  if (!p) return "";

  switch (card.type) {
    case "pinyin": {
      const item = p.item as { display: string; example: string };
      return `${item.display}。例：${item.example}`;
    }
    case "hanzi": {
      const item = p.item as { char: string; pinyin: string; sentence: string };
      return `${item.char}，${item.pinyin}。${item.sentence}`;
    }
    case "sentence": {
      const item = p.item as { text: string };
      return item.text;
    }
    case "idiom": {
      const item = p.item as { word: string; meaning: string; example: string };
      return `${item.word}，${item.meaning}。例：${item.example}`;
    }
    case "english-sentence": {
      const item = p.item as { en: string; zh: string };
      return `${item.en}。${item.zh}`;
    }
    case "word-problem": {
      const item = p.item as { question: string };
      return item.question;
    }
    case "poetry": {
      const title = p.title as string | undefined;
      const author = p.author as string | undefined;
      const content = p.content as string | undefined;
      return `《${title ?? ""}》${author ?? ""}。${(content ?? "").replace(/\n/g, "，")}`;
    }
    case "text": {
      const title = p.title as string | undefined;
      const text = (p.text as string) || (p.en as string) || (p.zh as string) || "";
      return title ? `${title}。${text}` : text;
    }
    default:
      return "";
  }
}
