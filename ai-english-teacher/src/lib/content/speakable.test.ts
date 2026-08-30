import { describe, expect, it } from "vitest";
import { getSpeakableFields, getSpeakableFromCard, splitSpeakableLines } from "./speakable";

describe("getSpeakableFromCard", () => {
  it("joins hanzi fields", () => {
    const text = getSpeakableFromCard({
      type: "hanzi",
      payload: { item: { char: "日", pinyin: "rì", sentence: "太阳出来了。" } },
    });
    expect(text).toContain("日");
    expect(text).toContain("rì");
    expect(text).toContain("太阳出来了");
  });

  it("covers text cards used by jokes and wiki", () => {
    const text = getSpeakableFromCard({
      type: "text",
      payload: { title: "😄 笑话", text: "为什么书会走路？" },
    });
    expect(text).toContain("笑话");
    expect(text).toContain("为什么书会走路");
  });
});

describe("splitSpeakableLines", () => {
  it("splits story by sentence and line", () => {
    expect(splitSpeakableLines("小兔子去采蘑菇。太阳公公笑了。")).toEqual([
      "小兔子去采蘑菇。",
      "太阳公公笑了。",
    ]);
    expect(splitSpeakableLines("床前明月光\n疑是地上霜")).toEqual(["床前明月光", "疑是地上霜"]);
  });
});

describe("getSpeakableFields", () => {
  it("splits english sentence into en and zh", () => {
    const fields = getSpeakableFields({
      type: "english-sentence",
      payload: { item: { en: "I like cats.", zh: "我喜欢猫。" } },
    });
    expect(fields).toEqual([
      { key: "en", text: "I like cats.", lang: "en" },
      { key: "zh", text: "我喜欢猫。", lang: "zh" },
    ]);
  });
});
