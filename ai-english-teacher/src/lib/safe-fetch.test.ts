import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchWithTimeout } from "./safe-fetch";

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves when fetch succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("ok", { status: 200 })))
    );
    const res = await fetchWithTimeout("https://example.com", 1000);
    expect(res.ok).toBe(true);
  });
});
