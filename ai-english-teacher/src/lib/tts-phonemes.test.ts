import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { applyToneSandhi, encodeIpa, replaceDigits, splitSpeakChunks, textToIpa } from "./tts-phonemes";

const table = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/models/tts-zh-huayan-x_low/pinyin-ipa.json"), "utf8")
) as Record<string, string>;
const config = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/models/tts-zh-huayan-x_low/zh_CN-huayan-x_low.onnx.json"), "utf8")
) as { phoneme_id_map: Record<string, number[]> };

describe("replaceDigits", () => {
  it("turns 1+1 into Chinese numerals", () => {
    expect(replaceDigits("1加1等于2")).toBe("一加一等于二");
  });
});

describe("applyToneSandhi", () => {
  it("changes the first of two third tones", () => {
    expect(applyToneSandhi(["ni3", "hao3"])).toEqual(["ni2", "hao3"]);
  });
});

describe("textToIpa + encodeIpa", () => {
  it("maps 你好 to Huayan phoneme ids", () => {
    const ipa = textToIpa("你好", table);
    expect(ipa).toContain("n");
    expect(ipa).toContain("χ");
    const ids = encodeIpa(ipa, config.phoneme_id_map);
    expect(ids[0]).toBe(config.phoneme_id_map["^"][0]);
    expect(ids[ids.length - 1]).toBe(config.phoneme_id_map["$"][0]);
    expect(ids.length).toBeGreaterThan(6);
  });

  it("keeps English letters speakable", () => {
    const ipa = textToIpa("apple", table);
    expect(ipa.length).toBeGreaterThan(2);
    expect(encodeIpa(ipa, config.phoneme_id_map).length).toBeGreaterThan(4);
  });
});

describe("splitSpeakChunks", () => {
  it("splits long replies so one ONNX call stays short", () => {
    const chunks = splitSpeakChunks("今天天气很好。我们去公园玩吧！");
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });
});
