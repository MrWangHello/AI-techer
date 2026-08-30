import { describe, expect, it } from "vitest";
import { lookupDictionaryLocal, lookupLocalEn, lookupLocalZh } from "./local-dictionary";

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
});
