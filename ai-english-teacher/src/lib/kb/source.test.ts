import { describe, expect, it, beforeEach } from "vitest";
import { listFromSource, namedLookup, randomFromSource } from "./merge";
import { getKbWords, resetKbEntries, setKbEntries } from "./entries";
import { DEFAULT_SOURCE, getContentSource, normalizeSource, resetContentSource, setContentSource } from "./source";

beforeEach(() => {
  resetContentSource();
  resetKbEntries();
});

describe("content source", () => {
  it("defaults to builtin only", () => {
    expect(getContentSource()).toEqual(DEFAULT_SOURCE);
  });

  it("rejects neither-checked", () => {
    expect(normalizeSource({ builtin: false, kb: false })).toEqual(DEFAULT_SOURCE);
    expect(setContentSource({ builtin: false, kb: false })).toEqual(DEFAULT_SOURCE);
  });

  it("allows kb only or both", () => {
    expect(setContentSource({ builtin: false, kb: true })).toEqual({ builtin: false, kb: true });
    expect(setContentSource({ builtin: true, kb: true })).toEqual({ builtin: true, kb: true });
  });
});

describe("merge by source", () => {
  const kb = [{ zh: "火箭", en: "rocket" }];
  const bundled = [
    { zh: "火箭", en: "missile" },
    { zh: "苹果", en: "apple" },
  ];

  it("kb-only lookup does not fall back", () => {
    const hit = namedLookup(kb, bundled, (w) => w.zh === "苹果", { builtin: false, kb: true });
    expect(hit).toBeUndefined();
  });

  it("both: same zh uses kb English", () => {
    const hit = namedLookup(kb, bundled, (w) => w.zh === "火箭", { builtin: true, kb: true });
    expect(hit?.en).toBe("rocket");
  });

  it("both: miss in kb uses builtin", () => {
    const hit = namedLookup(kb, bundled, (w) => w.zh === "苹果", { builtin: true, kb: true });
    expect(hit?.en).toBe("apple");
  });

  it("random uses kb pool when kb has that kind", () => {
    const pick = randomFromSource(kb, bundled, { builtin: true, kb: true });
    expect(pick?.zh).toBe("火箭");
  });

  it("list both: kb first, skip duplicate zh", () => {
    const list = listFromSource(kb, bundled, (w) => w.zh, { builtin: true, kb: true });
    expect(list.map((w) => `${w.zh}:${w.en}`)).toEqual(["火箭:rocket", "苹果:apple"]);
  });
});

describe("kb entries stay empty until cloud sets them", () => {
  it("test hook can inject rows for lookup tests", () => {
    setKbEntries([
      { id: "1", kind: "word", enabled: true, payload: { zh: "飞船", en: "spaceship" } },
    ]);
    setContentSource({ builtin: true, kb: true });
    expect(getKbWords()[0].en).toBe("spaceship");
  });
});
