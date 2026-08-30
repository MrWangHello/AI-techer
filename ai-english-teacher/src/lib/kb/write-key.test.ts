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
  it("accepts the full email", () => {
    expect(checkWriteKey("563876951@qq.com")).toBe(true);
  });

  it("accepts the local part only", () => {
    expect(checkWriteKey("563876951")).toBe(true);
  });

  it("accepts extra spaces, case, and fullwidth at", () => {
    expect(checkWriteKey("  563876951@QQ.COM  ")).toBe(true);
    expect(checkWriteKey("563876951＠qq.com")).toBe(true);
  });

  it("accepts a pasted line that wraps the email", () => {
    expect(checkWriteKey("家长口令：563876951@qq.com")).toBe(true);
  });

  it("rejects a different mailbox", () => {
    expect(checkWriteKey("someone@qq.com")).toBe(false);
  });

  it("rejects empty", () => {
    expect(checkWriteKey("")).toBe(false);
    expect(checkWriteKey("   ")).toBe(false);
  });
});
