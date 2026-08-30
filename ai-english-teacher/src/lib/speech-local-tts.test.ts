import { describe, expect, it } from "vitest";
import { audioEnergy, ensureLocalTts, synthesizeLocalAsync } from "./speech-local-tts";
import { friendlyTtsError } from "./speech-local-tts";

describe("friendlyTtsError", () => {
  it("rewrites Failed to fetch", () => {
    expect(friendlyTtsError(new Error("Failed to fetch"))).toMatch(/嘴巴包装不上/);
  });
});

describe("local Piper mouth actually speaks", () => {
  it("synthesizes 你好 with real energy", async () => {
    expect(await ensureLocalTts()).toBe(true);
    const { audio, sampleRate } = await synthesizeLocalAsync("你好");
    expect(sampleRate).toBe(16000);
    const { rms, peak, seconds } = audioEnergy(audio);
    expect(seconds).toBeGreaterThan(0.3);
    expect(rms).toBeGreaterThan(0.01);
    expect(peak).toBeGreaterThan(0.05);
  }, 30_000);
});
