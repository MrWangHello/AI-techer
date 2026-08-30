import { EMPTY_PACK, type KbPack } from "./types";

export const KB_LOCAL_KEY = "bella_kb";
export const KB_REMOTE_KEY = "bella_kb_remote";

let localPack: KbPack = EMPTY_PACK;
let remotePack: KbPack = EMPTY_PACK;
let localHydrated = false;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** 容错解析：缺字段当空数组，不抛 */
export function parseKbPack(raw: unknown): KbPack | null {
  if (!isRecord(raw)) return null;
  const version = raw.version === 1 ? 1 : 1;
  const hints = isRecord(raw.hints)
    ? Object.fromEntries(
        Object.entries(raw.hints).filter(([, v]) => typeof v === "string") as [string, string][]
      )
    : undefined;

  return {
    version,
    words: asArray(raw.words),
    stories: asArray(raw.stories),
    jokes: asArray(raw.jokes),
    poems: asArray(raw.poems),
    wordProblems: asArray(raw.wordProblems),
    dict: asArray(raw.dict),
    hints: hints && Object.keys(hints).length ? hints : undefined,
  };
}

function mergeArrays<T>(...lists: Array<T[] | undefined>): T[] | undefined {
  const out: T[] = [];
  for (const list of lists) {
    if (list?.length) out.push(...list);
  }
  return out.length ? out : undefined;
}

export function mergePacks(...packs: KbPack[]): KbPack {
  const hints: Record<string, string> = {};
  for (const p of packs) {
    if (p.hints) Object.assign(hints, p.hints);
  }
  return {
    version: 1,
    words: mergeArrays(...packs.map((p) => p.words)),
    stories: mergeArrays(...packs.map((p) => p.stories)),
    jokes: mergeArrays(...packs.map((p) => p.jokes)),
    poems: mergeArrays(...packs.map((p) => p.poems)),
    wordProblems: mergeArrays(...packs.map((p) => p.wordProblems)),
    dict: mergeArrays(...packs.map((p) => p.dict)),
    hints: Object.keys(hints).length ? hints : undefined,
  };
}

function readStorage(key: string): KbPack {
  if (typeof window === "undefined") return EMPTY_PACK;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_PACK;
    return parseKbPack(JSON.parse(raw)) ?? EMPTY_PACK;
  } catch {
    return EMPTY_PACK;
  }
}

function hydrateLocal(): void {
  if (localHydrated) return;
  localPack = readStorage(KB_LOCAL_KEY);
  remotePack = readStorage(KB_REMOTE_KEY);
  localHydrated = true;
}

export function getKb(): KbPack {
  hydrateLocal();
  return mergePacks(remotePack, localPack);
}

export function getLocalPack(): KbPack {
  hydrateLocal();
  return localPack;
}

export function saveLocalPack(pack: KbPack): KbPack {
  const normalized = parseKbPack(pack) ?? EMPTY_PACK;
  localPack = normalized;
  localHydrated = true;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KB_LOCAL_KEY, JSON.stringify(normalized));
    } catch {
      /* quota */
    }
  }
  return getKb();
}

export function importKbJson(text: string): { ok: true; pack: KbPack } | { ok: false; error: string } {
  try {
    const parsed = parseKbPack(JSON.parse(text));
    if (!parsed) return { ok: false, error: "不是有效的知识库 JSON" };
    const merged = mergePacks(getLocalPack(), parsed);
    saveLocalPack(merged);
    return { ok: true, pack: merged };
  } catch {
    return { ok: false, error: "JSON 解析失败，请检查格式" };
  }
}

export function clearLocalPack(): void {
  localPack = EMPTY_PACK;
  localHydrated = true;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(KB_LOCAL_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function sitePackUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}/kb/pack.json`;
}

export async function fetchSitePack(): Promise<KbPack | null> {
  try {
    const res = await fetch(sitePackUrl(), { cache: "no-store" });
    if (!res.ok) return null;
    const parsed = parseKbPack(await res.json());
    if (!parsed) return null;
    remotePack = parsed;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(KB_REMOTE_KEY, JSON.stringify(parsed));
      } catch {
        /* ignore */
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function initKnowledgeBase(): Promise<KbPack> {
  hydrateLocal();
  await fetchSitePack();
  return getKb();
}

/** 仅测试用 */
export function resetKbMemory(): void {
  localPack = EMPTY_PACK;
  remotePack = EMPTY_PACK;
  localHydrated = false;
}

export function setRemotePackForTests(pack: KbPack): void {
  remotePack = parseKbPack(pack) ?? EMPTY_PACK;
}
