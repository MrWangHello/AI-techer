import { test, expect } from "@playwright/test";
import { sendTextCommand } from "./helpers";

/** 目录中可离线、回复可在 UI 断言的抽样（完整短语见 feature-catalog unit） */
const SMOKE: { phrase: string; expectText: RegExp }[] = [
  { phrase: "帮助", expectText: /故事|口算|英语/ },
  { phrase: "汉字", expectText: /学习|字/ },
  { phrase: "口算", expectText: /口算|等于/ },
  { phrase: "书本用英语怎么说", expectText: /book/i },
  { phrase: "apple什么意思", expectText: /apple|苹果/i },
  { phrase: "讲笑话", expectText: /./ },
  { phrase: "1加1等于几", expectText: /2/ },
  { phrase: "考我", expectText: /测验/ },
  { phrase: "应用题", expectText: /答案是几|想一想/ },
];

test.describe("功能目录抽样（文字模拟语音）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  for (const { phrase, expectText } of SMOKE) {
    test(`「${phrase}」有可见回复`, async ({ page }) => {
      await sendTextCommand(page, phrase);
      await expect(page.getByText(expectText).first()).toBeVisible({ timeout: 10000 });
    });
  }
});
