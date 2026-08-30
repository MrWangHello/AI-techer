import type { KbEntry, KbKind } from "./entries";

const KINDS = new Set<KbKind>(["word", "hanzi", "story", "word_problem", "joke"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function mapCloudRow(raw: unknown): KbEntry | null {
  if (!isRecord(raw)) return null;
  const kind = raw.kind;
  if (typeof kind !== "string" || !KINDS.has(kind as KbKind)) return null;
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  const enabled = raw.enabled !== false;
  const payload = raw.payload;
  if (!isRecord(payload)) return null;

  if (kind === "word") {
    const zh = typeof payload.zh === "string" ? payload.zh.trim() : "";
    const en = typeof payload.en === "string" ? payload.en.trim() : "";
    if (!zh || !en) return null;
    const sentence = typeof payload.sentence === "string" ? payload.sentence : undefined;
    return { id, kind, enabled, payload: { zh, en, sentence } };
  }
  if (kind === "story") {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!title || !text) return null;
    const followup = typeof payload.followup === "string" ? payload.followup : undefined;
    return { id, kind, enabled, payload: { title, text, followup } };
  }
  if (kind === "hanzi") {
    const char = typeof payload.char === "string" ? payload.char.trim() : "";
    const pinyin = typeof payload.pinyin === "string" ? payload.pinyin.trim() : "";
    const words = Array.isArray(payload.words)
      ? payload.words.filter((w): w is string => typeof w === "string" && w.trim().length > 0).map((w) => w.trim())
      : [];
    const sentence = typeof payload.sentence === "string" ? payload.sentence : "";
    if (!char || !pinyin || !words.length) return null;
    const emoji = typeof payload.emoji === "string" ? payload.emoji : undefined;
    return { id, kind, enabled, payload: { char, pinyin, words, sentence, emoji } };
  }
  if (kind === "word_problem") {
    const question = typeof payload.question === "string" ? payload.question.trim() : "";
    const answer = typeof payload.answer === "number" ? payload.answer : Number(payload.answer);
    if (!question || !Number.isFinite(answer)) return null;
    const explain = typeof payload.explain === "string" ? payload.explain : undefined;
    const emoji = typeof payload.emoji === "string" ? payload.emoji : "🧮";
    return { id, kind, enabled, payload: { question, answer, explain, emoji } };
  }
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) return null;
  return { id, kind: "joke", enabled, payload: { text } };
}
