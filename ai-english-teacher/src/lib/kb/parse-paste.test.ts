import { describe, expect, it } from "vitest";
import { splitPaste } from "./parse-paste";

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
