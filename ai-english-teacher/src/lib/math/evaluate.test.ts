import { describe, expect, it } from "vitest";
import {
  parseMathExpression,
  compute,
  tryEvaluateFromText,
  parseAnswerNumber,
} from "./evaluate";
import { checkAnswer, startDrill, clearDrill } from "@/lib/math/drill-state";

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

  it("parses multi-digit and 答案是 prefix", () => {
    expect(parseAnswerNumber("12")).toBe(12);
    expect(parseAnswerNumber("答案是12")).toBe(12);
    expect(parseAnswerNumber("等于8")).toBe(8);
    expect(parseAnswerNumber("十一")).toBe(11);
    expect(parseAnswerNumber("十五")).toBe(15);
  });
});

describe("math drill flow", () => {
  it("checks answers correctly", () => {
    clearDrill();
    const q = startDrill(1);
    const { correct, streak } = checkAnswer(q.answer);
    expect(correct).toBe(true);
    expect(streak).toBe(1);
    clearDrill();
  });
});
