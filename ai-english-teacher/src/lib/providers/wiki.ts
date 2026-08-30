/** 从用户语音/文字中提取维基百科搜索词 */
export function extractWikiQuery(text: string): string {
  return text
    .trim()
    .replace(/[？?。！!，,\s]/g, "")
    .replace(/^(什么是|啥是|是谁|是什么|介绍一下|百科|维基|查一下|帮我查|告诉我)/g, "")
    .replace(/(是什么|是啥|是谁|有哪些|怎么样|怎样|的定义)$/g, "")
    .trim();
}

async function fetchSummaryByTitle(title: string): Promise<string | null> {
  const res = await fetch(
    `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`wiki: ${res.status}`);
  const data = await res.json();
  const extract = data.extract ?? data.description;
  if (!extract) return null;
  return extract.length > 260 ? `${extract.slice(0, 257)}…` : extract;
}

async function searchAndFetchSummary(query: string): Promise<string | null> {
  const searchRes = await fetch(
    `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`,
    { signal: AbortSignal.timeout(12000) }
  );
  if (!searchRes.ok) throw new Error(`wiki-search: ${searchRes.status}`);
  const searchData = await searchRes.json();
  const title = searchData.query?.search?.[0]?.title as string | undefined;
  if (!title) return null;
  return fetchSummaryByTitle(title);
}

export async function fetchWikiSummary(text: string): Promise<string | null> {
  const q = extractWikiQuery(text);
  if (q.length < 1) return null;

  const direct = await fetchSummaryByTitle(q);
  if (direct) return direct;

  return searchAndFetchSummary(q);
}
