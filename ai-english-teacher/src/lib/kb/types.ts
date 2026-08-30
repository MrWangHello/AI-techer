/** 用户/GitHub 知识库内容包（运行时合并，不进 JS bundle） */

export interface KbWord {
  en: string;
  zh: string;
  sentence?: string;
}

export interface KbStory {
  title: string;
  text: string;
}

export interface KbPoem {
  title: string;
  author?: string;
  content: string;
}

export interface KbWordProblem {
  question: string;
  answer: number;
  explain: string;
  emoji?: string;
}

export interface KbDictEntry {
  zh: string;
  en: string;
  sentence?: string;
}

export interface KbPack {
  version: 1;
  words?: KbWord[];
  stories?: KbStory[];
  jokes?: Array<string | { q: string; a: string }>;
  poems?: KbPoem[];
  wordProblems?: KbWordProblem[];
  dict?: KbDictEntry[];
  /** 覆盖 SECTION_VOICE_HINTS，key 如 english.words */
  hints?: Record<string, string>;
}

export const EMPTY_PACK: KbPack = { version: 1 };

export function countPack(pack: KbPack): {
  words: number;
  stories: number;
  jokes: number;
  poems: number;
  wordProblems: number;
  dict: number;
  hints: number;
} {
  return {
    words: pack.words?.length ?? 0,
    stories: pack.stories?.length ?? 0,
    jokes: pack.jokes?.length ?? 0,
    poems: pack.poems?.length ?? 0,
    wordProblems: pack.wordProblems?.length ?? 0,
    dict: pack.dict?.length ?? 0,
    hints: pack.hints ? Object.keys(pack.hints).length : 0,
  };
}
