import jokes from "@/data/jokes.json";
import stories from "@/data/stories.json";

export async function fetchHitokoto(category = "i"): Promise<string> {
  const res = await fetch(`https://v1.hitokoto.cn/?c=${category}`, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`hitokoto: ${res.status}`);
  const data = await res.json();
  const from = data.from ? ` ——${data.from}` : "";
  return `${data.hitokoto}${from}`;
}

export function pickRandomJoke(): string {
  const list = jokes as { q: string; a: string }[];
  const j = list[Math.floor(Math.random() * list.length)];
  return `${j.q} ${j.a}`;
}

export function pickRandomStory(): string {
  const list = stories as { title: string; text: string }[];
  const s = list[Math.floor(Math.random() * list.length)];
  return `《${s.title}》${s.text}`;
}
