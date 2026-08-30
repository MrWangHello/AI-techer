import pinyinData from "@/data/pinyin/grade1.json";
import hanziData from "@/data/hanzi/grade1.json";
import sentencesData from "@/data/sentences/grade1.json";
import idiomsData from "@/data/idioms.json";
import wordProblemsData from "@/data/word-problems/grade1.json";
import englishSentences from "@/data/english-sentences/grade1.json";
import { getKbHanzi, getKbProblems } from "@/lib/kb/entries";
import { randomFromSource } from "@/lib/kb/merge";

export interface PinyinItem {
  id: string;
  display: string;
  tip: string;
  emoji: string;
  example: string;
}

export interface HanziItem {
  char: string;
  emoji: string;
  pinyin: string;
  words: string[];
  sentence: string;
}

export interface SentenceItem {
  text: string;
  pinyin?: string;
  hint?: string;
}

export interface IdiomItem {
  word: string;
  pinyin: string;
  meaning: string;
  origin: string;
  example: string;
}

export interface WordProblemItem {
  question: string;
  answer: number;
  explain: string;
  emoji: string;
}

export interface EnglishSentenceItem {
  en: string;
  zh: string;
  emoji: string;
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function pickRandomPinyin(): PinyinItem {
  return pick(pinyinData as PinyinItem[]);
}

export function pickRandomHanzi(): HanziItem {
  const bundled = hanziData as HanziItem[];
  const extra = getKbHanzi().map((h) => ({
    char: h.char,
    emoji: h.emoji || "📝",
    pinyin: h.pinyin,
    words: h.words,
    sentence: h.sentence,
  }));
  return (
    randomFromSource(extra, bundled) ?? {
      char: "字",
      emoji: "📝",
      pinyin: "zì",
      words: [],
      sentence: "知识库里还没有汉字。去添加，或把内置勾上。",
    }
  );
}

export function pickRandomSentence(): SentenceItem {
  return pick(sentencesData as SentenceItem[]);
}

export function pickRandomIdiom(): IdiomItem {
  return pick(idiomsData as IdiomItem[]);
}

export function pickRandomWordProblem(): WordProblemItem {
  const bundled = wordProblemsData as WordProblemItem[];
  const extra = getKbProblems().map((w) => ({
    question: w.question,
    answer: w.answer,
    explain: w.explain || "",
    emoji: w.emoji || "🧮",
  }));
  return (
    randomFromSource(extra, bundled) ?? {
      question: "知识库里还没有应用题。去添加，或把内置勾上。",
      answer: -1,
      explain: "",
      emoji: "🧮",
    }
  );
}

export function pickRandomEnglishSentence(): EnglishSentenceItem {
  return pick(englishSentences as EnglishSentenceItem[]);
}

export function formatPinyinReply(p: PinyinItem): string {
  return `${p.emoji} 「${p.display}」${p.tip}。例：${p.example}`;
}

export function formatHanziReply(h: HanziItem): string {
  return `${h.emoji} 「${h.char}」读 ${h.pinyin}。组词：${h.words.join("、")}。${h.sentence}`;
}

export function formatSentenceReply(s: SentenceItem): string {
  return `📖 ${s.text}${s.hint ? `（${s.hint}）` : ""}`;
}

export function formatIdiomReply(i: IdiomItem): string {
  return `「${i.word}」${i.pinyin}。${i.meaning} 例：${i.example}`;
}

export function formatWordProblemReply(w: WordProblemItem): string {
  return `${w.emoji} ${w.question} 想一想，答案是几？`;
}

export function formatEnglishSentenceReply(s: EnglishSentenceItem): string {
  return `${s.emoji} ${s.en} — ${s.zh}`;
}
