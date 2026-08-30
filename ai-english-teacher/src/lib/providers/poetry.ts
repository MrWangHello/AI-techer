import shortPoems from "@/data/short-poems.json";

export interface Poem {
  title: string;
  author: string;
  content: string;
}

const POEMS = shortPoems as Poem[];

export function pickRandomShortPoem(): Poem {
  return POEMS[Math.floor(Math.random() * POEMS.length)];
}

/** 本地短诗（唐诗精选，适合 1–3 年级） */
export async function fetchRandomPoem(): Promise<Poem> {
  return pickRandomShortPoem();
}
