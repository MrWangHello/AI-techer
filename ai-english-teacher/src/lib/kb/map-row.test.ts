import { describe, expect, it } from "vitest";
import { mapCloudRow } from "./map-row";

describe("mapCloudRow", () => {
  it("maps a word row", () => {
    const row = mapCloudRow({
      id: "1",
      kind: "word",
      enabled: true,
      payload: { zh: "火箭", en: "rocket", sentence: "A rocket flies." },
    });
    expect(row).toMatchObject({ kind: "word", payload: { zh: "火箭", en: "rocket" } });
  });

  it("drops incomplete payloads", () => {
    expect(mapCloudRow({ id: "1", kind: "word", payload: { zh: "火箭" } })).toBeNull();
    expect(mapCloudRow({ id: "1", kind: "hint", payload: { text: "x" } })).toBeNull();
  });
});
