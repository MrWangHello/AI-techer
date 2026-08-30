import { describe, expect, it, beforeEach } from "vitest";
import {
  parseKbPack,
  mergePacks,
  importKbJson,
  getKb,
  saveLocalPack,
  resetKbMemory,
  setRemotePackForTests,
} from "./store";
import { EMPTY_PACK } from "./types";

beforeEach(() => {
  resetKbMemory();
});

describe("parseKbPack", () => {
  it("accepts a valid pack", () => {
    const p = parseKbPack({
      version: 1,
      dict: [{ zh: "火箭", en: "rocket" }],
    });
    expect(p?.dict?.[0].en).toBe("rocket");
  });

  it("rejects non-objects", () => {
    expect(parseKbPack("nope")).toBeNull();
    expect(parseKbPack(null)).toBeNull();
  });
});

describe("merge and lookup extras", () => {
  it("local overrides remote by appending (both available)", () => {
    setRemotePackForTests({ version: 1, dict: [{ zh: "远程", en: "remote" }] });
    saveLocalPack({ version: 1, dict: [{ zh: "火箭", en: "rocket" }] });
    const kb = getKb();
    expect(kb.dict?.map((d) => d.zh)).toEqual(["远程", "火箭"]);
  });

  it("importKbJson merges into local pack", () => {
    saveLocalPack({ version: 1, words: [{ en: "cat", zh: "猫" }] });
    const res = importKbJson(JSON.stringify({ version: 1, dict: [{ zh: "火箭", en: "rocket" }] }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.pack.words?.[0].en).toBe("cat");
      expect(res.pack.dict?.[0].en).toBe("rocket");
    }
  });

  it("mergePacks concatenates lists", () => {
    const m = mergePacks(
      { version: 1, stories: [{ title: "A", text: "a" }] },
      { version: 1, stories: [{ title: "B", text: "b" }] }
    );
    expect(m.stories).toHaveLength(2);
  });

  it("empty pack stays empty", () => {
    expect(getKb()).toEqual(EMPTY_PACK);
  });
});
