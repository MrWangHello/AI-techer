import { describe, expect, it } from "vitest";
import { displayPackProgress, friendlyPackError, MODEL_HOSTS, pickReachableHost } from "./speech-local";

describe("displayPackProgress", () => {
  it("keeps 0-100 values, including early 1%", () => {
    expect(displayPackProgress(37)).toBe(37);
    expect(displayPackProgress(1)).toBe(1);
  });

  it("scales 0-1 fractions so a half-done file is not stuck at 1%", () => {
    expect(displayPackProgress(0.37)).toBe(37);
    expect(displayPackProgress(0.01)).toBe(1);
  });
});

describe("friendlyPackError", () => {
  it("rewrites Failed to fetch for parents", () => {
    expect(friendlyPackError(new Error("Failed to fetch"))).toMatch(/模型站连不上/);
  });
});

describe("pickReachableHost", () => {
  it("prefers the first host that returns ok", async () => {
    const host = await pickReachableHost(async (input) => {
      const url = String(input);
      if (url.startsWith("https://hf-mirror.com/")) {
        return new Response("{}", { status: 200 });
      }
      return new Response("no", { status: 503 });
    });
    expect(host).toBe(MODEL_HOSTS[0]);
  });

  it("falls back to huggingface when the mirror is down", async () => {
    const host = await pickReachableHost(async (input) => {
      const url = String(input);
      if (url.startsWith("https://huggingface.co/")) {
        return new Response("{}", { status: 200 });
      }
      throw new Error("Failed to fetch");
    });
    expect(host).toBe("https://huggingface.co/");
  });
});
