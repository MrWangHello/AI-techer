import { fetchWithTimeout } from "@/lib/safe-fetch";

export async function lookupWord(word: string): Promise<string | null> {
  const q = word.trim().replace(/[^a-zA-Z-]/g, "");
  if (!q || q.length > 30) return null;
  const url = `https://dict-mobile.iciba.com/interface/index.php?c=word&m=getsuggest&isneedmean=1&word=${encodeURIComponent(q)}`;
  const res = await fetchWithTimeout(url, 8000);
  if (!res.ok) return null;
  const data = await res.json();
  const entry = data?.message?.[0];
  if (!entry) return null;
  if (entry.paraphrase) return entry.paraphrase;
  if (Array.isArray(entry.means)) {
    return entry.means
      .map((m: { part?: string; means?: string[] }) =>
        m.part ? `${m.part} ${(m.means ?? []).join("；")}` : (m.means ?? []).join("；")
      )
      .join("；");
  }
  return null;
}
