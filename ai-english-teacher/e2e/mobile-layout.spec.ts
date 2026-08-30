import { test, expect } from "@playwright/test";
import { sendTextCommand, openStudyTab } from "./helpers";

test.describe("手机点读与侧栏对话", () => {
  test("汉字整行可点读，喇叭是小图标", async ({ page }) => {
    await openStudyTab(page);
    await page.getByRole("button", { name: "语文", exact: true }).click();
    const hanzi = page.locator(".text-7xl");
    await expect(hanzi).toBeVisible({ timeout: 5000 });
    const line = page.getByRole("button", { name: /朗读/ }).first();
    await expect(line).toBeVisible();
    const box = await line.boundingBox();
    expect(box?.width).toBeGreaterThan(80);
    await line.click();
  });

  test("学科芯片保留拼音，底栏没有拼音", async ({ page }) => {
    await openStudyTab(page);
    await expect(page.getByText("yīng yǔ")).toBeVisible();
    await expect(page.getByRole("navigation").getByText("shǒu yè")).toHaveCount(0);
    await expect(page.getByRole("navigation").getByText("xué xí")).toHaveCount(0);
  });

  test("对话浮条露出「你」，全文不挡课卡", async ({ page }) => {
    await page.goto("/");
    await sendTextCommand(page, "帮助");
    await expect(page.getByText("你").first()).toBeVisible();
    await expect(page.getByText(/讲故事|口算|知识库/).first()).toBeVisible();
  });

  test("测验点选项答题，小喇叭另读", async ({ page }) => {
    await openStudyTab(page);
    await page.getByRole("button", { name: "英语", exact: true }).click();
    await page.getByRole("button", { name: "开始测验" }).click();
    const option = page.locator("button").filter({ hasText: /^[A-Za-z]{2,}$/ }).first();
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    await expect(page.getByText(/回答正确|正确答案/).first()).toBeVisible({ timeout: 3000 });
  });
});
