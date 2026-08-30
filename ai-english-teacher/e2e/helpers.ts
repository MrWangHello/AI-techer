import { Page, expect } from "@playwright/test";

/** 切换到文字输入并发送指令（绕过 STT，测试意图与 API） */
export async function sendTextCommand(page: Page, text: string) {
  const toKeyboard = page.getByRole("button", { name: "切换到键盘输入" });
  if (await toKeyboard.isVisible()) {
    await toKeyboard.click();
  }
  const input = page.getByPlaceholder("输入文字与 Bella 对话...");
  await input.fill(text);
  await page.getByRole("button", { name: "发送" }).click();
  await expect(page.getByText("你", { exact: true }).first()).toBeVisible({ timeout: 8000 });
}

export async function openStudyTab(page: Page) {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("button", { name: "学习", exact: true }).click();
  await expect(page.getByRole("heading", { name: /学习中心/ })).toBeVisible();
}

export async function openTab(page: Page, name: "首页" | "宠物" | "学习" | "设置") {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
}
