import { describe, expect, it } from "vitest";
import { matchShortcutContent, matchReadAloud } from "./nav-content";

describe("matchShortcutContent", () => {
  it("loads story with speakable reply for 故事", () => {
    const res = matchShortcutContent("故事");
    expect(res?.intent).toBe("story");
    expect(res?.studySection).toBe("reading.story");
    expect(res?.contentCard?.type).toBe("text");
    expect(res?.reply.length).toBeGreaterThan(10);
  });

  it("loads poetry for 背古诗", () => {
    const res = matchShortcutContent("背古诗");
    expect(res?.intent).toBe("poetry");
    expect(res?.contentCard?.type).toBe("poetry");
  });
});

describe("matchReadAloud", () => {
  it("reads last speakable text", () => {
    const res = matchReadAloud("朗读", { channel: "web", lastSpeakableText: "从前有座山" });
    expect(res?.intent).toBe("read_aloud");
    expect(res?.reply).toBe("从前有座山");
  });

  it("hints when nothing to read", () => {
    const res = matchReadAloud("读一下", { channel: "web" });
    expect(res?.intent).toBe("read_aloud_empty");
    expect(res?.reply).toContain("讲故事");
  });
});
