import { test, expect } from "@playwright/test";
import { sendTextCommand, openStudyTab, openTab } from "./helpers";

test.describe("全功能意图（文字模拟语音）", () => {
  test("百科：猫是什么（离线兜底）", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "猫是什么");
    await expect(page.getByText(/猫科|家养|宠物/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/暂时不可用/)).not.toBeVisible();
  });

  test("百科：什么是恐龙", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "什么是恐龙");
    await expect(page.getByText(/恐龙|中生代|爬行动物/).first()).toBeVisible({ timeout: 15000 });
  });

  test("天气：北京天气", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "北京天气");
    await expect(page.getByText(/北京.*°C|气温/).first()).toBeVisible({ timeout: 15000 });
  });

  test("导航：汉字 → 学习页", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "汉字");
    await expect(page.getByRole("heading", { name: /学习中心/ })).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".text-7xl")).toBeVisible({ timeout: 5000 });
  });

  test("导航：口算 → 数学练习", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "口算");
    await expect(page.getByRole("button", { name: "确定" }).first()).toBeVisible({ timeout: 8000 });
  });

  test("内容：讲笑话", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "讲笑话");
    await expect(page.getByText(/笑话|哈哈|为什么/).first()).toBeVisible({ timeout: 8000 });
  });

  test("数学：1加1等于几", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "1加1等于几");
    await expect(page.getByText(/等于 2|等于2/)).toBeVisible({ timeout: 8000 });
  });

  test("美句：STT误识别美剧也能触发", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "来说一句美剧");
    await expect(page.getByText(/——/).first()).toBeVisible({ timeout: 8000 });
  });

  test("语文美句 Tab 有内容", async ({ page }) => {
    await openStudyTab(page);
    await page.getByRole("button", { name: "语文", exact: true }).click();
    await page.getByRole("button", { name: "美句", exact: true }).click();
    await expect(page.getByText("✨ 美句")).toBeVisible({ timeout: 5000 });
  });

  test("数学 9+1：点1和0再确定才提交", async ({ page }) => {
    await openStudyTab(page);
    await page.getByRole("button", { name: "数学", exact: true }).click();
    const drill = page.locator(".border-amber-100").filter({ hasText: "确定" });
    await drill.getByRole("button", { name: "1", exact: true }).click();
    await expect(drill.locator("span.text-pink-500")).toHaveText("1");
    await expect(page.getByText(/没关系|对了/)).not.toBeVisible();
    await drill.getByRole("button", { name: "0", exact: true }).click();
    await expect(drill.locator("span.text-pink-500")).toHaveText("10");
  });

  test("故事为中文内容", async ({ page }) => {
    await openStudyTab(page);
    await page.getByRole("button", { name: "阅读", exact: true }).click();
    await expect(page.getByText(/小兔子|小明|小蜜蜂|玲玲|小红|小猫/).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/Bella was|The Little Cat/i)).not.toBeVisible();
  });

  test("语文古诗为短诗", async ({ page }) => {
    await openStudyTab(page);
    await page.getByRole("button", { name: "语文", exact: true }).click();
    await page.getByRole("button", { name: "古诗", exact: true }).click();
    const poem = page.locator(".border-amber-100").first();
    await expect(poem).toBeVisible({ timeout: 5000 });
    const text = await poem.innerText();
    expect(text.length).toBeLessThan(120);
    expect(text).toMatch(/静夜思|春晓|咏鹅|悯农|登鹳雀楼|江南|古朗月行|池上/);
  });
});

test.describe("Tab 与页面完整性", () => {
  test("首页快捷入口全部可点", async ({ page }) => {
    await page.goto("/");
    for (const label of ["英语", "语文", "数学", "阅读", "探索"]) {
      await page.getByRole("button", { name: label }).first().click();
      await expect(page.getByRole("heading", { name: /学习中心/ })).toBeVisible();
      await page.getByRole("navigation").getByRole("button", { name: "首页", exact: true }).click();
    }
  });

  test("宠物 Tab 互动按钮存在", async ({ page }) => {
    await openTab(page, "宠物");
    await expect(page.getByRole("button", { name: "喂食" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "玩耍" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "洗澡" })).toBeVisible();
    await expect(page.getByRole("button", { name: "睡觉" })).toBeVisible();
  });

  test("设置 Tab 语音与数据区块", async ({ page }) => {
    await openTab(page, "设置");
    await expect(page.getByText("语音设置")).toBeVisible();
    await expect(page.getByText("数据管理")).toBeVisible();
  });

  test("学习各学科子 Tab 有内容", async ({ page }) => {
    await openStudyTab(page);
    const cases: [string, RegExp][] = [
      ["语文", /\.text-7xl|拼音|组词/],
      ["数学", /点数字作答|应用题/],
      ["阅读", /故事|笑话/],
      ["探索", /试试说/],
    ];
    for (const [subject, pattern] of cases) {
      await page.getByRole("button", { name: subject, exact: true }).click();
      await expect(page.locator("body")).toContainText(pattern, { timeout: 5000 });
    }
  });

  test("英语单词区有词卡", async ({ page }) => {
    await openStudyTab(page);
    await page.getByRole("button", { name: "英语", exact: true }).click();
    await expect(page.getByRole("button", { name: /朗读/ }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "换一批" })).toBeVisible();
  });
});

test.describe("语音栏 UI", () => {
  test("麦克风按钮足够大且文案正确", async ({ page }) => {
    await page.goto("/");
    const mic = page.getByRole("button", { name: /点击说话/ });
    await expect(mic).toBeVisible();
    const box = await mic.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
