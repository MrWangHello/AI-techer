import shortPoems from "@/data/short-poems.json";
import { getKb } from "@/lib/kb/store";

export interface Poem {
  title: string;
  author: string;
  content: string;
}

const POEMS = shortPoems as Poem[];

export function pickRandomShortPoem(): Poem {
  const extra = (getKb().poems ?? []).map((p) => ({
    title: p.title,
    author: p.author || "",
    content: p.content,
  }));
  const list = extra.length ? [...POEMS, ...extra] : POEMS;
  return list[Math.floor(Math.random() * list.length)];
}

/** 本地短诗（唐诗精选，适合 1–3 年级） */
export async function fetchRandomPoem(): Promise<Poem> {
  return pickRandomShortPoem();
}
