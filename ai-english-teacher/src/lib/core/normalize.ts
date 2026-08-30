export function normalizeInput(raw: string): string {
  return raw.toLowerCase().replace(/[，。！？、,.!?'\s]/g, "").trim();
}

export function includesKeyword(normalized: string, keyword: string): boolean {
  return normalized.includes(keyword.toLowerCase());
}

export function matchKeywords(normalized: string, keywords: string[]): boolean {
  return keywords.some((kw) => includesKeyword(normalized, kw));
}
