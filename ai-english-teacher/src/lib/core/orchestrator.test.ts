import { describe, expect, it } from "vitest";
import { handleUserMessage, processUserInput } from "./orchestrator";

describe("processUserInput navigation", () => {
  it("routes 汉字 to chinese section", () => {
    const res = processUserInput("汉字");
    expect(res.studySection).toBe("chinese.hanzi");
    expect(res.navigate).toBe("study");
  });

  it("routes 口算 to math drill", () => {
    const res = processUserInput("口算");
    expect(res.studySection).toBe("math.drill");
    expect(res.navigate).toBe("study");
  });
});

describe("handleUserMessage navigation", () => {
  it("routes 讲笑话 to reading joke", async () => {
    const res = await handleUserMessage({ text: "讲笑话", channel: "web" });
    expect(res.studySection).toBe("reading.joke");
    expect(res.navigate).toBe("study");
    expect(res.contentCard?.type).toBe("text");
  });
});

describe("handleUserMessage math", () => {
  it("evaluates 1加1等于几", async () => {
    const res = await handleUserMessage({ text: "1加1等于几", channel: "web" });
    expect(res.reply).toContain("2");
    expect(res.intent).toBe("math_calc");
  });

  it("starts drill on 口算", async () => {
    const res = await handleUserMessage({ text: "口算", channel: "web" });
    expect(res.studySection).toBe("math.drill");
    expect(res.contentCard?.type).toBe("math-drill");
  });
});
