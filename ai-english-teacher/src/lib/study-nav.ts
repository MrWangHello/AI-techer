import type { ContentCard } from "@/lib/core/types";

export type StudySubject = "english" | "chinese" | "math" | "reading" | "explore";

export interface ParsedSection {
  subject: StudySubject;
  sub: string;
}

const SUBJECT_MAP: Record<string, StudySubject> = {
  english: "english",
  chinese: "chinese",
  math: "math",
  reading: "reading",
  explore: "explore",
};

export function parseStudySection(section?: string): ParsedSection {
  if (!section) return { subject: "english", sub: "words" };
  const [rawSubject, ...rest] = section.split(".");
  const subject = SUBJECT_MAP[rawSubject] ?? "english";
  const sub = rest.join(".") || (subject === "english" ? "words" : subject === "chinese" ? "hanzi" : "drill");
  return { subject, sub };
}

export function buildStudySection(subject: StudySubject, sub: string): string {
  return `${subject}.${sub}`;
}

export const SUBJECT_LABELS: Record<StudySubject, string> = {
  english: "英语",
  chinese: "语文",
  math: "数学",
  reading: "阅读",
  explore: "探索",
};

export const CHINESE_SUB_LABELS: Record<string, string> = {
  pinyin: "拼音",
  hanzi: "汉字",
  sentence: "句子",
  story: "故事",
  poetry: "古诗",
  idiom: "成语",
  quote: "美句",
};

export const ENGLISH_SUB_LABELS: Record<string, string> = {
  words: "单词",
  sentence: "句子",
};

export const MATH_SUB_LABELS: Record<string, string> = {
  drill: "口算",
  "word-problem": "应用题",
};

export const READING_SUB_LABELS: Record<string, string> = {
  story: "故事",
  joke: "笑话",
};

export const EXPLORE_SUB_LABELS: Record<string, string> = {
  weather: "天气",
  wiki: "百科",
};

export function contentCardFromResponse(card?: ContentCard): ContentCard | null {
  return card ?? null;
}
