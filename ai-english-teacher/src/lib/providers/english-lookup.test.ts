import { describe, expect, it } from "vitest";
import { extractChineseQuery } from "./english-lookup";

describe("extractChineseQuery", () => {
  it("extracts noun from 用英语怎么说", () => {
    expect(extractChineseQuery("书本用英语怎么说")).toBe("书本");
    expect(extractChineseQuery("苹果用英文怎么说")).toBe("苹果");
  });

  it("extracts from short 怎么说 pattern", () => {
    expect(extractChineseQuery("书本怎么说")).toBe("书本");
  });

  it("does not match unrelated phrases", () => {
    expect(extractChineseQuery("数学怎么说")).toBeNull();
    expect(extractChineseQuery("口算")).toBeNull();
  });
});
