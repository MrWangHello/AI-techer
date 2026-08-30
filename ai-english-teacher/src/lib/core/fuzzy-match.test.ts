import { describe, expect, it } from "vitest";
import {
  fuzzyMatchKeyword,
  canonicalizeVariants,
  similarity,
} from "./fuzzy-match";
import { normalizeInput } from "./normalize";

describe("canonicalizeVariants", () => {
  it("maps 美剧 to 美句", () => {
    expect(canonicalizeVariants("来说一句美剧")).toContain("美句");
  });

  it("maps 汉子 to 汉字", () => {
    expect(canonicalizeVariants("学汉子")).toContain("汉字");
  });
});

describe("fuzzyMatchKeyword", () => {
  it("matches via normalized pipeline", () => {
    expect(fuzzyMatchKeyword(normalizeInput("美句"), "美句")).toBe(true);
    expect(fuzzyMatchKeyword(normalizeInput("汉子"), "汉字")).toBe(true);
  });

  it("similarity helper for typos", () => {
    expect(similarity("口算", "口算题")).toBeGreaterThan(0.6);
  });
});
