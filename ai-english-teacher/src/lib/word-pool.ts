import allWords from "@/data/words.json";
import { getKbWords } from "@/lib/kb/entries";
import { listFromSource } from "@/lib/kb/merge";

export interface Word {
  en: string;
  zh: string;
  sentence: string;
}

const STORAGE_KEY = "bella_word_batch";
const BATCH_SIZE = 20;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getAllWords(): Word[] {
  const bundled = allWords as Word[];
  const extra = getKbWords().map((w) => ({
    en: w.en,
    zh: w.zh,
    sentence: w.sentence || "",
  }));
  return listFromSource(extra, bundled, (w) => w.zh);
}

export function loadWordBatch(): Word[] {
  if (typeof window === "undefined") return (allWords as Word[]).slice(0, BATCH_SIZE);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Word[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return refreshWordBatch();
}

export function refreshWordBatch(): Word[] {
  const batch = shuffle(getAllWords()).slice(0, BATCH_SIZE);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(batch));
    } catch (_) {}
  }
  return batch;
}
