import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { extractWikiQuery, fetchWikiSummary } from "./wiki";

describe("extractWikiQuery", () => {
  it("strips leading and trailing question patterns", () => {
    expect(extractWikiQuery("什么是恐龙")).toBe("恐龙");
    expect(extractWikiQuery("猫是什么")).toBe("猫");
    expect(extractWikiQuery("恐龙是什么？")).toBe("恐龙");
    expect(extractWikiQuery("介绍一下猫")).toBe("猫");
    expect(extractWikiQuery("百科猫")).toBe("猫");
  });

  it("returns empty for too-short queries", () => {
    expect(extractWikiQuery("百科")).toBe("");
    expect(extractWikiQuery("是什么")).toBe("");
  });
});

describe("fetchWikiSummary", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("猫是什么")) {
          return { status: 404, ok: false, json: async () => ({}) };
        }
        if (url.includes("/summary/%E7%8C%AB") || url.includes("/summary/猫")) {
          return {
            status: 200,
            ok: true,
            json: async () => ({ extract: "猫是一种小型食肉动物。" }),
          };
        }
        if (url.includes("api.php")) {
          return {
            status: 200,
            ok: true,
            json: async () => ({ query: { search: [{ title: "猫" }] } }),
          };
        }
        return { status: 404, ok: false, json: async () => ({}) };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves 猫是什么 via cleaned title", async () => {
    const summary = await fetchWikiSummary("猫是什么");
    expect(summary).toContain("食肉动物");
  });
});
