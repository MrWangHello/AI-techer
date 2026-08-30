import { fetchWithTimeout } from "@/lib/safe-fetch";

/**
 * 可选在线补充。查词主路径已改为本地词库，此函数必须永不抛错。
 */
export async function lookupWord(word: string): Promise<string | null> {
  try {
    const q = word.trim().replace(/[^a-zA-Z-]/g, "");
    if (!q || q.length > 30) return null;
    const url = `https://dict-mobile.iciba.com/interface/index.php?c=word&m=getsuggest&isneedmean=1&word=${encodeURIComponent(q)}`;
    const res = await fetchWithTimeout(url, 2500);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      message?: Array<{ paraphrase?: string; means?: Array<{ part?: string; means?: string[] }> }>;
    };
    const entry = data?.message?.[0];
    if (!entry) return null;
    if (entry.paraphrase) return entry.paraphrase;
    if (Array.isArray(entry.means)) {
      return entry.means
        .map((m) => (m.part ? `${m.part} ${(m.means ?? []).join("；")}` : (m.means ?? []).join("；")))
        .join("；");
    }
    return null;
  } catch {
    return null;
  }
}
