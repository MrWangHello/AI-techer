import jokes from "@/data/jokes.json";
import stories from "@/data/stories.json";
import chineseStories from "@/data/chinese-stories.json";
import quotes from "@/data/quotes.json";
import { getKbJokes, getKbStories } from "@/lib/kb/entries";
import { randomFromSource } from "@/lib/kb/merge";

export function pickRandomQuote(): string {
  const list = quotes as { text: string; from: string }[];
  const q = list[Math.floor(Math.random() * list.length)];
  return `${q.text} ——${q.from}`;
}

export function pickRandomChineseStory(): { title: string; text: string } {
  const bundled = chineseStories as { title: string; text: string }[];
  const extra = getKbStories();
  return (
    randomFromSource(extra, bundled) ?? {
      title: "还没有故事",
      text: "知识库里还没有故事。去添加，或把内置勾上。",
    }
  );
}

export async function fetchHitokoto(category = "i"): Promise<string> {
  try {
    const res = await fetch(`https://v1.hitokoto.cn/?c=${category}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`hitokoto: ${res.status}`);
    const data = await res.json();
    const from = data.from ? ` ——${data.from}` : "";
    return `${data.hitokoto}${from}`;
  } catch {
    return pickRandomQuote();
  }
}

export function pickRandomJoke(): string {
  const bundled = (jokes as { q: string; a: string }[]).map((j) => `${j.q} ${j.a}`);
  const extra = getKbJokes().map((j) => j.text);
  return randomFromSource(extra, bundled) ?? "知识库里还没有笑话。去添加，或把内置勾上。";
}

/** 英文故事（英语模块用） */
export function pickRandomEnglishStory(): string {
  const list = stories as { title: string; text: string }[];
  const s = list[Math.floor(Math.random() * list.length)];
  return `《${s.title}》${s.text}`;
}

/** @deprecated 使用 pickRandomChineseStory */
export function pickRandomStory(): string {
  const s = pickRandomChineseStory();
  return `《${s.title}》${s.text}`;
}
