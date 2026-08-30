import { describe, expect, it, beforeEach } from "vitest";
import { handleUserMessage, processUserInput } from "./orchestrator";
import { applySttCorrections } from "@/lib/core/normalize";
import { clearDrill } from "@/lib/math/drill-state";
import { clearWordProblem } from "@/lib/math/word-problem-state";
import { updateSession } from "@/lib/session-store";

beforeEach(() => {
  clearDrill();
  clearWordProblem();
  updateSession({ lastStudySection: undefined });
});

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

  it("routes 猫是什么 to wiki with content", async () => {
    const res = await handleUserMessage({ text: "猫是什么", channel: "web" });
    expect(res.intent).toBe("wiki");
    expect(res.studySection).toBe("explore.wiki");
    expect(res.reply.length).toBeGreaterThan(10);
    expect(res.reply).not.toContain("暂时不可用");
  });

  it("routes STT-corrected 美剧 to 美句", async () => {
    const corrected = applySttCorrections("来说一句美剧");
    const res = await handleUserMessage({ text: corrected, channel: "web" });
    expect(res.intent).toBe("hitokoto");
    expect(res.studySection).toBe("chinese.quote");
    expect(res.reply.length).toBeGreaterThan(5);
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

  it("accepts 10个 as answer 10", async () => {
    await handleUserMessage({ text: "口算", channel: "web" });
    const res = await handleUserMessage({ text: "10个", channel: "web" });
    expect(["math_drill_correct", "math_drill_wrong"]).toContain(res.intent);
  });

  it("blocks navigation during active drill", async () => {
    await handleUserMessage({ text: "口算", channel: "web" });
    const res = await handleUserMessage({ text: "故事", channel: "web" });
    expect(res.intent).toBe("math_drill_hint");
    expect(res.studySection).toBe("math.drill");
  });

  it("exits drill on 停止口算", async () => {
    await handleUserMessage({ text: "口算", channel: "web" });
    const res = await handleUserMessage({ text: "停止口算", channel: "web" });
    expect(res.intent).toBe("math_drill_exit");
  });

  it("yields drill for 应用题", async () => {
    await handleUserMessage({ text: "口算", channel: "web" });
    const res = await handleUserMessage({ text: "应用题", channel: "web" });
    expect(res.intent).toBe("word_problem");
    expect(res.studySection).toBe("math.word-problem");
  });

  it("yields drill for 考我", async () => {
    await handleUserMessage({ text: "口算", channel: "web" });
    const res = await handleUserMessage({ text: "考我", channel: "web" });
    expect(res.intent).toBe("quiz");
    expect(res.sideEffect).toBe("study.quiz.start");
  });
});

describe("handleUserMessage word problem", () => {
  it("starts a word problem on 应用题", async () => {
    const res = await handleUserMessage({ text: "应用题", channel: "web" });
    expect(res.studySection).toBe("math.word-problem");
    expect(res.contentCard?.type).toBe("word-problem");
    expect(res.intent).toBe("word_problem");
  });

  it("grades a correct spoken answer", async () => {
    const start = await handleUserMessage({ text: "应用题", channel: "web" });
    const item = (start.contentCard?.payload as { item: { answer: number; explain: string } }).item;
    const res = await handleUserMessage({ text: String(item.answer), channel: "web" });
    expect(res.intent).toBe("word_problem_correct");
    expect(res.reply).toContain(item.explain);
    expect(res.contentCard?.type).toBe("word-problem");
  });

  it("grades 答案是N as the number N", async () => {
    const start = await handleUserMessage({ text: "应用题", channel: "web" });
    const item = (start.contentCard?.payload as { item: { answer: number } }).item;
    const res = await handleUserMessage({ text: `答案是${item.answer}`, channel: "web" });
    expect(res.intent).toBe("word_problem_correct");
  });

  it("explains on a wrong answer", async () => {
    const start = await handleUserMessage({ text: "应用题", channel: "web" });
    const item = (start.contentCard?.payload as { item: { answer: number; explain: string } }).item;
    const wrong = item.answer === 1 ? 2 : 1;
    const res = await handleUserMessage({ text: String(wrong), channel: "web" });
    expect(res.intent).toBe("word_problem_wrong");
    expect(res.reply).toContain(String(item.answer));
    expect(res.reply).toContain(item.explain);
  });

  it("does not grade a bare number outside word-problem", async () => {
    const res = await handleUserMessage({ text: "8", channel: "web" });
    expect(res.intent).not.toBe("word_problem_correct");
    expect(res.intent).not.toBe("word_problem_wrong");
  });
});

describe("handleUserMessage quiz", () => {
  it("opens word quiz on 考我", async () => {
    const res = await handleUserMessage({ text: "考我", channel: "web" });
    expect(res.intent).toBe("quiz");
    expect(res.studySection).toBe("english.words");
    expect(res.navigate).toBe("study");
    expect(res.sideEffect).toBe("study.quiz.start");
  });

  it("opens word quiz on 测验", async () => {
    const res = await handleUserMessage({ text: "测验", channel: "web" });
    expect(res.intent).toBe("quiz");
    expect(res.sideEffect).toBe("study.quiz.start");
  });
});

describe("handleUserMessage dictionary", () => {
  it("looks up 书本用英语怎么说", async () => {
    const res = await handleUserMessage({ text: "书本用英语怎么说", channel: "web" });
    expect(res.intent).toBe("dict_hit");
    expect(res.reply).toContain("book");
  });

  it("loads story content for 故事 shortcut", async () => {
    const res = await handleUserMessage({ text: "故事", channel: "web" });
    expect(res.intent).toBe("story");
    expect(res.contentCard?.type).toBe("text");
    expect(res.reply.length).toBeGreaterThan(20);
  });
});
