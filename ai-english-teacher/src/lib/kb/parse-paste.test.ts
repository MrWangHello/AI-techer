import { describe, expect, it } from "vitest";
import { aiPromptFor, splitPaste } from "./parse-paste";

describe("splitPaste words", () => {
  it("parses zh en, comma, colon, and leftover sentence", () => {
    const rows = splitPaste(
      "word",
      "火箭 rocket\n书本, book\n飞船：spaceship A spaceship is fast."
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ ok: true, payload: { zh: "火箭", en: "rocket" } });
    expect(rows[1]).toMatchObject({ ok: true, payload: { zh: "书本", en: "book" } });
    expect(rows[2]).toMatchObject({
      ok: true,
      payload: { zh: "飞船", en: "spaceship", sentence: "A spaceship is fast." },
    });
  });

  it("accepts en first", () => {
    const [row] = splitPaste("word", "rocket 火箭");
    expect(row).toMatchObject({ ok: true, payload: { zh: "火箭", en: "rocket" } });
  });

  it("marks a line without English as error", () => {
    const [row] = splitPaste("word", "只有中文");
    expect(row.ok).toBe(false);
  });
});

describe("splitPaste hanzi", () => {
  it("parses char pinyin words sentence", () => {
    const [row] = splitPaste("hanzi", "天 tiān 天空、天气 今天天气真好。");
    expect(row).toMatchObject({
      ok: true,
      kind: "hanzi",
      payload: { char: "天", pinyin: "tiān", words: ["天空", "天气"], sentence: "今天天气真好。" },
    });
  });

  it("parses tab-separated hanzi", () => {
    const [row] = splitPaste("hanzi", "地\tdì\t土地、大地\t大地绿油油的。");
    expect(row).toMatchObject({
      ok: true,
      payload: { char: "地", pinyin: "dì", words: ["土地", "大地"] },
    });
  });

  it("marks a line without pinyin as error", () => {
    const [row] = splitPaste("hanzi", "只有汉字");
    expect(row.ok).toBe(false);
  });
});

describe("splitPaste stories and problems", () => {
  it("splits stories on ---", () => {
    const rows = splitPaste("story", "小熊猫\n\n找妈妈。\n---\n笑话\n\n哈哈。");
    expect(rows.filter((r) => r.ok)).toHaveLength(2);
    if (rows[0].ok && rows[0].kind === "story") {
      expect(rows[0].payload.title).toBe("小熊猫");
      expect(rows[0].payload.text).toContain("找妈妈");
    }
  });

  it("takes the last number as the answer", () => {
    const [row] = splitPaste("word_problem", "小明有 2 个苹果，又拿到 1 个，一共几个？ 3");
    expect(row).toMatchObject({ ok: true, payload: { answer: 3 } });
    if (row.ok && row.kind === "word_problem") {
      expect(row.payload.question).toContain("小明");
    }
  });

  it("rejects a problem without a trailing number", () => {
    const [row] = splitPaste("word_problem", "一共几个？");
    expect(row.ok).toBe(false);
  });
});

describe("aiPromptFor", () => {
  it("includes input and output examples for every kind", () => {
    for (const kind of ["word", "hanzi", "story", "word_problem", "joke"] as const) {
      const prompt = aiPromptFor(kind);
      expect(prompt).toContain("输入例子");
      expect(prompt).toContain("输出例子");
      expect(prompt).toContain("原文：");
    }
    expect(aiPromptFor("joke")).toContain("不要拆成单词");
    expect(aiPromptFor("hanzi")).toContain("天\ttiān");
  });
});
