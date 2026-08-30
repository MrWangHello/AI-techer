import type { KbKind, KbJokePayload, KbProblemPayload, KbStoryPayload, KbWordPayload } from "./entries";

export type PreviewOk =
  | { ok: true; kind: "word"; payload: KbWordPayload; raw: string }
  | { ok: true; kind: "story"; payload: KbStoryPayload; raw: string }
  | { ok: true; kind: "word_problem"; payload: KbProblemPayload; raw: string }
  | { ok: true; kind: "joke"; payload: KbJokePayload; raw: string };

export type PreviewRow = PreviewOk | { ok: false; kind: KbKind; raw: string; error: string };

const SEP = /[,，、:：\t]+/g;

function parseWordLine(line: string): PreviewRow {
  const raw = line.trim();
  const tokens = raw.replace(SEP, " ").split(/\s+/).filter(Boolean);
  let zh = "";
  let en = "";
  const extra: string[] = [];
  for (const token of tokens) {
    if (!zh && /[\u4e00-\u9fff]/.test(token)) {
      zh = token;
    } else if (!en && /^[a-zA-Z][a-zA-Z'-]*$/.test(token)) {
      en = token;
    } else {
      extra.push(token);
    }
  }
  if (!zh || !en) {
    return { ok: false, kind: "word", raw, error: "这一行要有中文和英文，例如：火箭 rocket" };
  }
  const sentence = extra.join(" ").trim();
  return { ok: true, kind: "word", raw, payload: { zh, en, sentence: sentence || undefined } };
}

function parseProblemLine(line: string): PreviewRow {
  const raw = line.trim();
  const match = raw.match(/^(.*?)(\d+)\s*$/);
  if (!match) {
    return { ok: false, kind: "word_problem", raw, error: "行末要有数字答案，例如：一共几个？ 3" };
  }
  const question = match[1].replace(/[？?]\s*$/, "？").trim();
  if (!question) {
    return { ok: false, kind: "word_problem", raw, error: "缺少题目" };
  }
  return {
    ok: true,
    kind: "word_problem",
    raw,
    payload: { question, answer: Number(match[2]), emoji: "🧮" },
  };
}

function parseStoryChunk(chunk: string): PreviewRow {
  const raw = chunk.trim();
  if (!raw) {
    return { ok: false, kind: "story", raw: chunk, error: "故事是空的" };
  }
  const parts = raw.split(/\n\s*\n/);
  if (parts.length >= 2) {
    const title = parts[0].split("\n")[0].trim();
    const text = parts.slice(1).join("\n\n").trim();
    if (title && text) {
      return { ok: true, kind: "story", raw, payload: { title, text } };
    }
  }
  const first = raw.split("\n")[0].trim();
  const rest = raw.split("\n").slice(1).join("\n").trim();
  if (rest) {
    return { ok: true, kind: "story", raw, payload: { title: first, text: rest } };
  }
  const title = first.slice(0, 12) || "未命名故事";
  return { ok: true, kind: "story", raw, payload: { title, text: raw } };
}

function parseJokeChunk(chunk: string): PreviewRow {
  const raw = chunk.trim();
  if (!raw) {
    return { ok: false, kind: "joke", raw: chunk, error: "笑话是空的" };
  }
  return { ok: true, kind: "joke", raw, payload: { text: raw } };
}

export function splitPaste(kind: KbKind, text: string): PreviewRow[] {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  if (kind === "word" || kind === "word_problem") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => (kind === "word" ? parseWordLine(line) : parseProblemLine(line)));
  }

  return raw
    .split(/^\s*---\s*$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => (kind === "story" ? parseStoryChunk(chunk) : parseJokeChunk(chunk)));
}

export function aiPromptFor(kind: KbKind): string {
  if (kind === "word") {
    return [
      "把下面内容整理成单词模板，一行一条：中文<Tab>英文<Tab>例句。",
      "不要翻译成别的意思，不要编我不认识的词。",
      "没有例句就留空，不要自己造句。",
      "只输出表格，不要解释。",
      "",
      "原文：",
    ].join("\n");
  }
  if (kind === "word_problem") {
    return [
      "把下面内容整理成应用题，一行一题，最后是数字答案。",
      "答案数字必须和原文一致，不准改。",
      "只输出题目行，不要解释。",
      "",
      "原文：",
    ].join("\n");
  }
  if (kind === "story") {
    return [
      "把下面内容整理成故事：第一行标题，空一行，后面正文。",
      "多篇用一行 --- 隔开。不要续写，不要改情节。",
      "只输出整理后的故事，不要解释。",
      "",
      "原文：",
    ].join("\n");
  }
  return [
    "把下面内容整理成笑话，一篇一段。多篇用一行 --- 隔开。不要改包袱。",
    "只输出笑话，不要解释。",
    "",
    "原文：",
  ].join("\n");
}
