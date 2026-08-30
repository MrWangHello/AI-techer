import type {
  KbHanziPayload,
  KbJokePayload,
  KbKind,
  KbProblemPayload,
  KbStoryPayload,
  KbWordPayload,
} from "./entries";

export type PreviewOk =
  | { ok: true; kind: "word"; payload: KbWordPayload; raw: string }
  | { ok: true; kind: "hanzi"; payload: KbHanziPayload; raw: string }
  | { ok: true; kind: "story"; payload: KbStoryPayload; raw: string }
  | { ok: true; kind: "word_problem"; payload: KbProblemPayload; raw: string }
  | { ok: true; kind: "joke"; payload: KbJokePayload; raw: string };

export type PreviewRow = PreviewOk | { ok: false; kind: KbKind; raw: string; error: string };

const SEP = /[,，、:：\t]+/g;
const PINYIN = /^[a-zA-ZüÜvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňḿ]+[1-5]?$/;

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

function parseHanziLine(line: string): PreviewRow {
  const raw = line.trim();
  const tabs = raw.split(/\t/).map((s) => s.trim()).filter(Boolean);
  if (tabs.length >= 3) {
    const char = (tabs[0].match(/[\u4e00-\u9fff]/) ?? [""])[0];
    const pinyin = tabs[1];
    const words = tabs[2].split(/[、，,]/).map((s) => s.trim()).filter(Boolean);
    const sentence = tabs[3] ?? "";
    if (char && pinyin && words.length) {
      return { ok: true, kind: "hanzi", raw, payload: { char, pinyin, words, sentence } };
    }
  }

  const tokens = raw.split(/\s+/).filter(Boolean);
  const charToken = tokens.find((t) => /[\u4e00-\u9fff]/.test(t));
  const char = charToken?.match(/[\u4e00-\u9fff]/)?.[0] ?? "";
  const pinyin = tokens.find((t) => PINYIN.test(t) && !/[\u4e00-\u9fff]/.test(t)) ?? "";
  if (!char || !pinyin) {
    return { ok: false, kind: "hanzi", raw, error: "这一行要有汉字和拼音，例如：天 tiān 天空、天气 今天天气真好。" };
  }

  const rest = tokens.filter((t) => t !== charToken && t !== pinyin);
  if (!rest.length) {
    return { ok: false, kind: "hanzi", raw, error: "还要有组词，例如：天 tiān 天空、天气 今天天气真好。" };
  }

  let wordsStr = rest.join(" ");
  let sentence = "";
  const last = rest[rest.length - 1];
  if (rest.length >= 2 && (/[。！？.!?]$/.test(last) || last.length >= 4)) {
    sentence = last;
    wordsStr = rest.slice(0, -1).join("");
  }
  const words = wordsStr.split(/[、，,/]+/).map((s) => s.trim()).filter(Boolean);
  if (!words.length) {
    return { ok: false, kind: "hanzi", raw, error: "组词拆不开。用顿号隔开，例如：天空、天气" };
  }
  return { ok: true, kind: "hanzi", raw, payload: { char, pinyin, words, sentence } };
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

  if (kind === "word" || kind === "word_problem" || kind === "hanzi") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (kind === "word") return parseWordLine(line);
        if (kind === "hanzi") return parseHanziLine(line);
        return parseProblemLine(line);
      });
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
      "把下面内容整理成单词模板，一行一条，用 Tab 分开：中文、英文、例句。",
      "不要翻译成别的意思，不要编我不认识的词。没有例句就留空，不要自己造句。",
      "只输出整理后的行，不要解释。",
      "",
      "输入例子：",
      "火箭 rocket",
      "书本, book",
      "飞船：spaceship A spaceship is fast.",
      "",
      "输出例子：",
      "火箭\trocket",
      "书本\tbook",
      "飞船\tspaceship\tA spaceship is fast.",
      "",
      "原文：",
    ].join("\n");
  }
  if (kind === "hanzi") {
    return [
      "把下面内容整理成一年级汉字字词，一行一条，用 Tab 分开：汉字、拼音、组词、例句。",
      "组词用顿号隔开。拼音带声调。不要编我不认识的字，不要改例句意思。",
      "只输出整理后的行，不要解释。",
      "",
      "输入例子：",
      "天 天空 天气 今天天气真好",
      "地 di 土地 大地绿油油的。",
      "",
      "输出例子：",
      "天\ttiān\t天空、天气\t今天天气真好。",
      "地\tdì\t土地、大地\t大地绿油油的。",
      "",
      "原文：",
    ].join("\n");
  }
  if (kind === "word_problem") {
    return [
      "把下面内容整理成应用题，一行一题，最后是数字答案。",
      "答案数字必须和原文一致，不准改。只输出题目行，不要解释。",
      "",
      "输入例子：",
      "小明有 2 个苹果，又拿到 1 个，一共几个？答案是 3",
      "",
      "输出例子：",
      "小明有 2 个苹果，又拿到 1 个，一共几个？ 3",
      "",
      "原文：",
    ].join("\n");
  }
  if (kind === "story") {
    return [
      "把下面内容整理成故事：第一行标题，空一行，后面正文。",
      "多篇用单独一行 --- 隔开。不要续写，不要改情节。只输出整理后的故事，不要解释。",
      "",
      "输入例子：",
      "小熊猫找妈妈。有一只小熊猫走进竹林……另一篇：小猫钓鱼。小猫坐在河边。",
      "",
      "输出例子：",
      "小熊猫找妈妈",
      "",
      "有一只小熊猫走进竹林……",
      "---",
      "小猫钓鱼",
      "",
      "小猫坐在河边。",
      "",
      "原文：",
    ].join("\n");
  }
  return [
    "把下面内容整理成笑话。一篇就是一段完整笑话，不要拆成单词，不要加讲解。",
    "多篇用单独一行 --- 隔开。不要改包袱。只输出笑话，不要解释。",
    "",
    "输入例子：",
    "为什么书会走路？因为它有页。还有一则：小猫为什么不写作业？因为它不会喵作业。",
    "",
    "输出例子：",
    "为什么书会走路？因为它有页。",
    "---",
    "小猫为什么不写作业？因为它不会喵作业。",
    "",
    "原文：",
  ].join("\n");
}
