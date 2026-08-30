import { describe, expect, it } from "vitest";
import { detectSpeakLang } from "./speak-lang";

describe("detectSpeakLang", () => {
  it("treats Chinese-majority text as zh", () => {
    expect(detectSpeakLang("苹果")).toBe("zh");
    expect(detectSpeakLang("小猴子摘了 3 个桃")).toBe("zh");
    expect(detectSpeakLang("apple 是苹果")).toBe("zh");
    expect(detectSpeakLang("Hello 你好")).toBe("zh");
  });

  it("treats Latin-majority text as en", () => {
    expect(detectSpeakLang("apple")).toBe("en");
    expect(detectSpeakLang("I like cats.")).toBe("en");
  });

  it("defaults empty or symbol-only text to zh", () => {
    expect(detectSpeakLang("")).toBe("zh");
    expect(detectSpeakLang("123")).toBe("zh");
  });
});
