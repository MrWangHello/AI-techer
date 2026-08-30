import { describe, expect, it } from "vitest";
import { getVoiceHintForSection, SECTION_VOICE_HINTS } from "./voice-hints";

describe("getVoiceHintForSection", () => {
  it("returns exact hint for known section", () => {
    expect(getVoiceHintForSection("reading.story")).toBe(SECTION_VOICE_HINTS["reading.story"]);
  });

  it("covers chinese.story (语文 Tab 下的故事)", () => {
    expect(getVoiceHintForSection("chinese.story")).toContain("讲故事");
  });

  it("falls back to subject hint for unknown sub", () => {
    const hint = getVoiceHintForSection("english.unknown");
    expect(hint).toContain("学英语");
  });
});
