import { describe, expect, it } from "vitest";
import {
  parseMathExpression,
  compute,
  tryEvaluateFromText,
  parseAnswerNumber,
} from "./evaluate";

describe("parseMathExpression", () => {
  it("parses digit expressions", () => {
    expect(parseMathExpression("1加1等于几")).toEqual({ a: 1, op: "+", b: 1 });
    expect(parseMathExpression("10减3")).toEqual({ a: 10, op: "-", b: 3 });
  });

  it("parses Chinese numerals", () => {
    expect(parseMathExpression("三加五等于几")).toEqual({ a: 3, op: "+", b: 5 });
  });
});

describe("compute", () => {
  it("evaluates basic ops", () => {
    expect(compute(2, "+", 3)).toBe(5);
    expect(compute(9, "-", 4)).toBe(5);
    expect(compute(3, "*", 4)).toBe(12);
    expect(compute(7, "/", 2)).toBe(3);
  });
});

describe("tryEvaluateFromText", () => {
  it("returns reply for valid math question", () => {
    const result = tryEvaluateFromText("1加1等于几");
    expect(result?.result).toBe(2);
    expect(result?.reply).toContain("等于 2");
  });
});

describe("parseAnswerNumber", () => {
  it("parses digits and Chinese numbers", () => {
    expect(parseAnswerNumber("8")).toBe(8);
    expect(parseAnswerNumber("八")).toBe(8);
  });
});
