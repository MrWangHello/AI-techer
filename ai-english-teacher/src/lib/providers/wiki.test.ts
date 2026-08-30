import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { extractWikiQuery, lookupLocalWiki, fetchWikiSummary } from "./wiki";

describe("extractWikiQuery", () => {
  it("strips leading and trailing question patterns", () => {
    expect(extractWikiQuery("什么是恐龙")).toBe("恐龙");
    expect(extractWikiQuery("猫是什么")).toBe("猫");
    expect(extractWikiQuery("恐龙是什么？")).toBe("恐龙");
    expect(extractWikiQuery("介绍一下猫")).toBe("猫");
  });
});

describe("lookupLocalWiki", () => {
  it("finds 猫 and 恐龙 offline", () => {
    expect(lookupLocalWiki("猫")).toContain("猫科");
    expect(lookupLocalWiki("猫是什么")).toContain("猫科");
    expect(lookupLocalWiki("恐龙")).toContain("中生代");
  });

  it("returns null for unknown topics", () => {
    expect(lookupLocalWiki("量子力学")).toBeNull();
  });
});

describe("fetchWikiSummary", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network blocked");
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to offline when network fails", async () => {
    const summary = await fetchWikiSummary("猫是什么");
    expect(summary).toContain("猫科");
  });

  it("falls back offline for 恐龙 when network blocked", async () => {
    const summary = await fetchWikiSummary("什么是恐龙");
    expect(summary).toContain("中生代");
  });
});
