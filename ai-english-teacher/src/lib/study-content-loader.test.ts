import { describe, expect, it } from "vitest";
import { loadDefaultContentForSection } from "./study-content-loader";

describe("loadDefaultContentForSection", () => {
  it("loads hanzi card for chinese.hanzi", () => {
    const { contentCard, mathQuestion } = loadDefaultContentForSection("chinese.hanzi");
    expect(contentCard?.type).toBe("hanzi");
    expect(mathQuestion).toBeNull();
  });

  it("loads math drill for math.drill", () => {
    const { contentCard, mathQuestion } = loadDefaultContentForSection("math.drill");
    expect(contentCard).toBeNull();
    expect(mathQuestion).not.toBeNull();
    expect(mathQuestion?.a).toBeTypeOf("number");
  });

  it("loads story/joke text for reading", () => {
    const story = loadDefaultContentForSection("reading.story");
    expect(story.contentCard?.type).toBe("text");
    expect((story.contentCard?.payload as { text?: string }).text?.length).toBeGreaterThan(0);

    const joke = loadDefaultContentForSection("reading.joke");
    expect(joke.contentCard?.type).toBe("text");
  });

  it("loads explore tips", () => {
    const { contentCard } = loadDefaultContentForSection("explore.weather");
    expect(contentCard?.type).toBe("text");
    expect((contentCard?.payload as { text?: string }).text).toContain("天气");
  });

  it("loads word problem for math.word-problem", () => {
    const { contentCard } = loadDefaultContentForSection("math.word-problem");
    expect(contentCard?.type).toBe("word-problem");
  });
});
