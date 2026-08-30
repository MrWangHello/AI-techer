import { describe, expect, it, beforeEach } from "vitest";
import {
  extractDrillAnswer,
  mergeVoiceDrillDigit,
  resetDrillVoiceBuffer,
} from "./drill-answer";

describe("extractDrillAnswer", () => {
  it("strips measure words", () => {
    expect(extractDrillAnswer("10个")).toBe(10);
    expect(extractDrillAnswer("10")).toBe(10);
    expect(extractDrillAnswer("答案是10")).toBe(10);
    expect(extractDrillAnswer("十")).toBe(10);
  });

  it("does not confuse longer phrases as single wrong digit", () => {
    expect(extractDrillAnswer("10个苹果")).toBe(10);
  });
});

describe("mergeVoiceDrillDigit", () => {
  beforeEach(() => resetDrillVoiceBuffer());

  it("merges 1 then 0 into 10 for two-digit answers", () => {
    expect(mergeVoiceDrillDigit(1, 10)).toBeNull();
    expect(mergeVoiceDrillDigit(0, 10)).toBe(10);
  });

  it("returns single digit when answer is single digit", () => {
    expect(mergeVoiceDrillDigit(5, 5)).toBe(5);
  });
});
