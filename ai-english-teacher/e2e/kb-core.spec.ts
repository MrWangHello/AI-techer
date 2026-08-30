import { test, expect } from "@playwright/test";
import { sendTextCommand, openTab } from "./helpers";

/** 核心：文字模拟语音 → 意图落地（不测真实麦克风） */
test.describe("核心意图（文字=语音）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("帮助列出指令", async ({ page }) => {
    await sendTextCommand(page, "帮助");
    await expect(page.getByText(/讲故事|口算|知识库/).first()).toBeVisible({ timeout: 8000 });
  });

  test("回首页", async ({ page }) => {
    await sendTextCommand(page, "回首页");
    await expect(page.getByRole("heading", { name: /首页/ })).toBeVisible({ timeout: 8000 });
  });

  test("看宠物", async ({ page }) => {
    await sendTextCommand(page, "看宠物");
    await expect(page.getByRole("heading", { name: /我的宠物/ })).toBeVisible({ timeout: 8000 });
  });

  test("打开设置看到知识库", async ({ page }) => {
    await sendTextCommand(page, "知识库");
    await expect(page.getByRole("heading", { name: /设置/ })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("heading", { name: /知识库/ })).toBeVisible();
  });

  test("查词 书本 / apple", async ({ page }) => {
    await sendTextCommand(page, "书本用英语怎么说");
    await expect(page.getByText(/book/i).first()).toBeVisible({ timeout: 8000 });
    await sendTextCommand(page, "apple什么意思");
    await expect(page.getByText(/苹果/).first()).toBeVisible({ timeout: 8000 });
  });

  test("汉字 / 口算 / 讲故事 进学习", async ({ page }) => {
    await sendTextCommand(page, "汉字");
    await expect(page.getByRole("heading", { name: /学习中心/ })).toBeVisible({ timeout: 8000 });
    await sendTextCommand(page, "口算");
    await expect(page.getByRole("button", { name: "确定" }).first()).toBeVisible({ timeout: 8000 });
    await sendTextCommand(page, "停止口算");
  });

  test("1加1等于几", async ({ page }) => {
    await sendTextCommand(page, "1加1等于几");
    await expect(page.getByText(/等于 2|等于2/)).toBeVisible({ timeout: 8000 });
  });

  test("喂食意图有回复", async ({ page }) => {
    await sendTextCommand(page, "喂食");
    await expect(page.getByText(/谢谢喂|好香/).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("知识库动态加词", () => {
  test("本机知识库可查未打包的词", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "bella_kb",
        JSON.stringify({
          version: 1,
          dict: [{ zh: "飞船", en: "spaceship", sentence: "A spaceship is fast." }],
        })
      );
    });
    await page.goto("/");
    await sendTextCommand(page, "飞船用英语怎么说");
    await expect(page.getByText(/spaceship/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("设置页有导入入口", async ({ page }) => {
    await openTab(page, "设置");
    await expect(page.getByRole("heading", { name: /知识库/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "导入 JSON 文件" })).toBeVisible();
    await expect(page.getByRole("button", { name: "粘贴导入" })).toBeVisible();
  });
});
