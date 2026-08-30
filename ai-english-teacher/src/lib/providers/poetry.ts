export interface Poem {
  title: string;
  author: string;
  content: string;
}

export async function fetchRandomPoem(): Promise<Poem> {
  const res = await fetch("https://poetry.palemoky.com/api/poems/random", {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`poetry: ${res.status}`);
  const json = await res.json();
  const data = json.data ?? json;
  const lines: string[] = Array.isArray(data.content) ? data.content : [String(data.content ?? "")];
  return {
    title: data.title ?? "无题",
    author: data.author?.name ?? data.author ?? "佚名",
    content: lines.filter(Boolean).join("，"),
  };
}
