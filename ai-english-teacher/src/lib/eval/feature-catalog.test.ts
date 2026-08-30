import { describe, expect, it, beforeEach } from "vitest";
import { FEATURE_CASES, featureStats } from "./feature-catalog";
import { handleUserMessage } from "@/lib/core/orchestrator";
import { clearDrill } from "@/lib/math/drill-state";
import { clearWordProblem } from "@/lib/math/word-problem-state";

beforeEach(() => {
  clearDrill();
  clearWordProblem();
});

describe("feature catalog integrity", () => {
  it("has unique ids and at least one voice phrase each", () => {
    const ids = FEATURE_CASES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FEATURE_CASES) {
      expect(f.voicePhrases.length, f.id).toBeGreaterThan(0);
      expect(f.name.length, f.id).toBeGreaterThan(0);
    }
  });

  it("reports status mix for evaluation", () => {
    const s = featureStats();
    expect(s.total).toBeGreaterThanOrEqual(20);
    expect(s.ok + s.partial + s.broken + s.placeholder).toBe(s.total);
  });
});

describe("voice phrase → intent (catalog-driven)", () => {
  for (const feature of FEATURE_CASES) {
    for (const phrase of feature.voicePhrases) {
      it(`${feature.id}: 「${phrase}」`, async () => {
        clearDrill();
        clearWordProblem();
        const res = await handleUserMessage({ text: phrase, channel: "web" });

        if (feature.expected.intent) {
          const intents = Array.isArray(feature.expected.intent)
            ? feature.expected.intent
            : [feature.expected.intent];
          expect(intents, phrase).toContain(res.intent);
        }
        if (feature.expected.studySection) {
          expect(res.studySection, phrase).toBe(feature.expected.studySection);
        }
        if (feature.expected.navigate) {
          expect(res.navigate, phrase).toBe(feature.expected.navigate);
        }
        if (feature.expected.minReplyLen) {
          expect(res.reply.length, phrase).toBeGreaterThanOrEqual(feature.expected.minReplyLen);
        }
        if (feature.expected.sideEffect) {
          expect(res.sideEffect, phrase).toBe(feature.expected.sideEffect);
        }
      });
    }
  }
});
