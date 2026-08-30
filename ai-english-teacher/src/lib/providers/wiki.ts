export async function fetchWikiSummary(text: string): Promise<string | null> {
  let q = text
    .replace(/^(什么是|啥是|是谁|是什么|介绍一下|百科|维基|查一下)/g, "")
    .replace(/[？?。！!]/g, "")
    .trim();
  if (q.length < 2) return null;

  const res = await fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`, {
    signal: AbortSignal.timeout(12000),
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`wiki: ${res.status}`);
  const data = await res.json();
  const extract = data.extract ?? data.description;
  if (!extract) return null;
  return extract.length > 260 ? `${extract.slice(0, 257)}…` : extract;
}
