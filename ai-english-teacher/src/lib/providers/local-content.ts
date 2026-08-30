import jokes from "@/data/jokes.json";
import stories from "@/data/stories.json";
import chineseStories from "@/data/chinese-stories.json";
import quotes from "@/data/quotes.json";

export function pickRandomQuote(): string {
  const list = quotes as { text: string; from: string }[];
  const q = list[Math.floor(Math.random() * list.length)];
  return `${q.text} ——${q.from}`;
}

export function pickRandomChineseStory(): { title: string; text: string } {
  const list = chineseStories as { title: string; text: string }[];
  return list[Math.floor(Math.random() * list.length)];
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
  const list = jokes as { q: string; a: string }[];
  const j = list[Math.floor(Math.random() * list.length)];
  return `${j.q} ${j.a}`;
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
