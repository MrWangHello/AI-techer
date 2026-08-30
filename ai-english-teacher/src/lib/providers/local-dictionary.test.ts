import { describe, expect, it, beforeEach } from "vitest";
import { lookupDictionaryLocal, lookupLocalEn, lookupLocalZh } from "./local-dictionary";
import { resetKbEntries, setKbEntries } from "@/lib/kb/entries";
import { resetContentSource, setContentSource } from "@/lib/kb/source";

beforeEach(() => {
  resetKbEntries();
  resetContentSource();
});

describe("local dictionary", () => {
  it("looks up apple instantly without network", () => {
    expect(lookupLocalEn("apple")?.zh).toBe("苹果");
    const res = lookupDictionaryLocal("apple什么意思");
    expect(res?.intent).toBe("dict_hit");
    expect(res?.reply).toContain("apple");
  });

  it("looks up 书本 locally", () => {
    expect(lookupLocalZh("书本")?.en).toBe("book");
    const res = lookupDictionaryLocal("书本用英语怎么说");
    expect(res?.intent).toBe("dict_hit");
    expect(res?.reply).toContain("book");
  });

  it("returns miss without throwing", () => {
    const res = lookupDictionaryLocal("xyzzy什么意思");
    expect(res?.intent).toBe("dict_miss");
  });

  it("hits knowledge-base dict when source includes kb", () => {
    setContentSource({ builtin: true, kb: true });
    setKbEntries([
      {
        id: "1",
        kind: "word",
        enabled: true,
        payload: { zh: "火箭", en: "rocket", sentence: "A rocket flies." },
      },
    ]);
    const res = lookupDictionaryLocal("火箭用英语怎么说");
    expect(res?.intent).toBe("dict_hit");
    expect(res?.reply).toContain("rocket");
    expect(lookupLocalZh("火箭")?.en).toBe("rocket");
    expect(lookupLocalEn("rocket")?.zh).toBe("火箭");
  });

  it("does not use kb rows when source is builtin only", () => {
    setKbEntries([
      { id: "1", kind: "word", enabled: true, payload: { zh: "量子", en: "quantum" } },
    ]);
    expect(lookupLocalZh("量子")).toBeNull();
  });
});
