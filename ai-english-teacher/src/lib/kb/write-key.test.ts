import { describe, expect, it } from "vitest";
import { checkWriteKey, DEFAULT_WRITE_KEY } from "./write-key";

describe("checkWriteKey", () => {
  it("accepts the configured email, ignoring case and spaces", () => {
    expect(checkWriteKey(DEFAULT_WRITE_KEY)).toBe(true);
    expect(checkWriteKey(`  ${DEFAULT_WRITE_KEY.toUpperCase()}  `)).toBe(true);
  });

  it("rejects empty or other text", () => {
    expect(checkWriteKey("")).toBe(false);
    expect(checkWriteKey("1234")).toBe(false);
    expect(checkWriteKey("other@qq.com")).toBe(false);
  });
});
