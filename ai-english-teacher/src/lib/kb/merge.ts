import type { ContentSource } from "./source";
import { getContentSource } from "./source";

export function namedLookup<T>(
  kbList: T[],
  builtinList: T[],
  match: (item: T) => boolean,
  source: ContentSource = getContentSource()
): T | undefined {
  if (source.kb) {
    const hit = kbList.find(match);
    if (hit) return hit;
  }
  if (source.builtin) {
    return builtinList.find(match);
  }
  return undefined;
}

export function randomFromSource<T>(
  kbList: T[],
  builtinList: T[],
  source: ContentSource = getContentSource()
): T | undefined {
  if (source.kb && kbList.length > 0) {
    return kbList[Math.floor(Math.random() * kbList.length)];
  }
  if (source.builtin && builtinList.length > 0) {
    return builtinList[Math.floor(Math.random() * builtinList.length)];
  }
  return undefined;
}

export function listFromSource<T>(
  kbList: T[],
  builtinList: T[],
  keyOf: (item: T) => string,
  source: ContentSource = getContentSource()
): T[] {
  if (source.kb && !source.builtin) return [...kbList];
  if (!source.kb && source.builtin) return [...builtinList];
  if (source.kb && source.builtin) {
    const seen = new Set(kbList.map(keyOf));
    return [...kbList, ...builtinList.filter((item) => !seen.has(keyOf(item)))];
  }
  return [];
}
