import { describe, expect, it } from "vitest";
import { applySttCorrections, normalizeInput, matchKeywords } from "./normalize";

describe("STT corrections", () => {
  it("corrects 美剧 to 美句", () => {
    expect(applySttCorrections("来说一句美剧")).toContain("美句");
    expect(normalizeInput("美剧")).toBe("美句");
  });

  it("corrects 每句 to 美句", () => {
    expect(normalizeInput("每句")).toBe("美句");
  });

  it("corrects 汉子 to 汉字", () => {
    expect(normalizeInput("学汉子")).toContain("汉字");
  });

  it("matches 美句 keyword after correction", () => {
    expect(matchKeywords(normalizeInput("美剧"), ["美句"])).toBe(true);
  });
});
