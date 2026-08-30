export type ContentSource = {
  builtin: boolean;
  kb: boolean;
};

export const CONTENT_SOURCE_KEY = "bella_content_source";
export const DEFAULT_SOURCE: ContentSource = { builtin: true, kb: false };

let cached: ContentSource | null = null;

export function normalizeSource(raw: Partial<ContentSource> | null | undefined): ContentSource {
  const builtin = !!raw?.builtin;
  const kb = !!raw?.kb;
  if (!builtin && !kb) return { ...DEFAULT_SOURCE };
  return { builtin, kb };
}

function readStorage(): ContentSource {
  if (typeof window === "undefined") return { ...DEFAULT_SOURCE };
  try {
    const raw = localStorage.getItem(CONTENT_SOURCE_KEY);
    if (!raw) return { ...DEFAULT_SOURCE };
    return normalizeSource(JSON.parse(raw) as Partial<ContentSource>);
  } catch {
    return { ...DEFAULT_SOURCE };
  }
}

export function getContentSource(): ContentSource {
  if (!cached) cached = readStorage();
  return cached;
}

export function setContentSource(next: Partial<ContentSource>): ContentSource {
  const normalized = normalizeSource(next);
  cached = normalized;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONTENT_SOURCE_KEY, JSON.stringify(normalized));
    } catch {
      /* quota */
    }
  }
  return normalized;
}

/** 仅测试用 */
export function resetContentSource(): void {
  cached = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(CONTENT_SOURCE_KEY);
    } catch {
      /* ignore */
    }
  }
}
