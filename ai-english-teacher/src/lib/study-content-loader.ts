/**
 * 切换学习分区时自动加载默认可展示内容（点击 Tab 不再空白）
 */
import type { ContentCard } from "@/lib/core/types";
import type { MathQuestion } from "@/lib/math/generator";
import { startDrill } from "@/lib/math/drill-state";
import {
  pickRandomPinyin,
  pickRandomHanzi,
  pickRandomSentence,
  pickRandomIdiom,
  pickRandomWordProblem,
  pickRandomEnglishSentence,
} from "@/lib/providers/chinese-content";
import { pickRandomJoke, pickRandomStory, pickRandomQuote } from "@/lib/providers/local-content";
import { parseStudySection } from "@/lib/study-nav";

export interface SectionContent {
  contentCard: ContentCard | null;
  mathQuestion: MathQuestion | null;
}

function card(type: ContentCard["type"], payload: Record<string, unknown>): ContentCard {
  return { type, payload };
}

export function loadDefaultContentForSection(studySection: string): SectionContent {
  const { subject, sub } = parseStudySection(studySection);

  if (subject === "chinese") {
    if (sub === "pinyin") {
      return { contentCard: card("pinyin", { item: pickRandomPinyin() }), mathQuestion: null };
    }
    if (sub === "hanzi") {
      return { contentCard: card("hanzi", { item: pickRandomHanzi() }), mathQuestion: null };
    }
    if (sub === "sentence") {
      return { contentCard: card("sentence", { item: pickRandomSentence() }), mathQuestion: null };
    }
    if (sub === "idiom") {
      return { contentCard: card("idiom", { item: pickRandomIdiom() }), mathQuestion: null };
    }
    if (sub === "poetry") {
      return { contentCard: null, mathQuestion: null };
    }
    if (sub === "quote") {
      const text = pickRandomQuote();
      return { contentCard: card("text", { text, title: "✨ 美句" }), mathQuestion: null };
    }
    return { contentCard: card("hanzi", { item: pickRandomHanzi() }), mathQuestion: null };
  }

  if (subject === "english") {
    if (sub === "sentence") {
      return {
        contentCard: card("english-sentence", { item: pickRandomEnglishSentence() }),
        mathQuestion: null,
      };
    }
    return { contentCard: null, mathQuestion: null };
  }

  if (subject === "math") {
    if (sub === "word-problem") {
      return {
        contentCard: card("word-problem", { item: pickRandomWordProblem() }),
        mathQuestion: null,
      };
    }
    return { contentCard: null, mathQuestion: startDrill(1) };
  }

  if (subject === "reading") {
    if (sub === "joke") {
      const text = pickRandomJoke();
      return { contentCard: card("text", { text, title: "😄 笑话" }), mathQuestion: null };
    }
    const text = pickRandomStory();
    return { contentCard: card("text", { text, title: "📖 故事" }), mathQuestion: null };
  }

  if (subject === "explore") {
    const tips =
      sub === "wiki"
        ? "试试说：「猫是什么」「什么是恐龙」"
        : "试试说：「北京天气」「今天几度」";
    return { contentCard: card("text", { text: tips, title: "🔍 探索" }), mathQuestion: null };
  }

  return { contentCard: null, mathQuestion: null };
}
