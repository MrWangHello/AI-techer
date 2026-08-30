import { describe, expect, it } from "vitest";
import { checkWriteKey, normalizeWriteKey, writeKeyHint } from "./write-key";

describe("normalizeWriteKey", () => {
  it("strips spaces and fullwidth at", () => {
    expect(normalizeWriteKey("  563876951＠qq.com  ")).toBe("563876951@qq.com");
  });
});

describe("writeKeyHint", () => {
  it("does not reveal the mailbox", () => {
    expect(writeKeyHint()).toBe("家长口令");
    expect(writeKeyHint()).not.toMatch(/@|qq\.com|\d{6,}/);
  });
});

describe("checkWriteKey", () => {
  it("accepts either known mailbox, including the one typed on the add page", () => {
    expect(checkWriteKey("563876951@qq.com")).toBe(true);
    expect(checkWriteKey("563870951@qq.com")).toBe(true);
    expect(checkWriteKey("563870951")).toBe(true);
  });

  it("accepts extra spaces, case, and fullwidth at", () => {
    expect(checkWriteKey("  563870951@QQ.COM  ")).toBe(true);
    expect(checkWriteKey("563870951＠qq.com")).toBe(true);
  });

  it("accepts any well-formed email", () => {
    expect(checkWriteKey("parent@qq.com")).toBe(true);
  });

  it("rejects empty or non-email", () => {
    expect(checkWriteKey("")).toBe(false);
    expect(checkWriteKey("   ")).toBe(false);
    expect(checkWriteKey("abc")).toBe(false);
  });
});
