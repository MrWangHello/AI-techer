import wikiSnippets from "@/data/wiki-snippets.json";

export interface WikiSnippet {
  title: string;
  keywords: string[];
  summary: string;
}

const SNIPPETS = wikiSnippets as WikiSnippet[];

/** 离线百科：国内网络无法访问维基时使用 */
export function lookupLocalWiki(query: string): string | null {
  const q = query.trim();
  if (!q) return null;

  const exact = SNIPPETS.find((s) => s.title === q);
  if (exact) return exact.summary;

  for (const item of SNIPPETS) {
    if (item.keywords.some((kw) => q.includes(kw) || kw.includes(q))) {
      return item.summary;
    }
  }

  return null;
}

const ONLINE_TIMEOUT_MS = 4500;

async function fetchSummaryByTitle(title: string): Promise<string | null> {
  const res = await fetch(
    `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    {
      signal: AbortSignal.timeout(ONLINE_TIMEOUT_MS),
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
    { signal: AbortSignal.timeout(ONLINE_TIMEOUT_MS) }
  );
  if (!searchRes.ok) throw new Error(`wiki-search: ${searchRes.status}`);
  const searchData = await searchRes.json();
  const title = searchData.query?.search?.[0]?.title as string | undefined;
  if (!title) return null;
  return fetchSummaryByTitle(title);
}

async function fetchOnlineWiki(query: string): Promise<string | null> {
  const direct = await fetchSummaryByTitle(query);
  if (direct) return direct;
  return searchAndFetchSummary(query);
}

/** 从用户语音/文字中提取维基百科搜索词 */
export function extractWikiQuery(text: string): string {
  return text
    .trim()
    .replace(/[？?。！!，,\s]/g, "")
    .replace(/^(什么是|啥是|是谁|是什么|介绍一下|百科|维基|查一下|帮我查|告诉我)/g, "")
    .replace(/(是什么|是啥|是谁|有哪些|怎么样|怎样|的定义)$/g, "")
    .trim();
}

export async function fetchWikiSummary(text: string): Promise<string | null> {
  const q = extractWikiQuery(text);
  if (q.length < 1) return null;

  const local = lookupLocalWiki(q);

  try {
    const online = await fetchOnlineWiki(q);
    if (online) return online;
  } catch {
    // 国内移动网络常无法访问维基，走离线库
  }

  return local;
}
