import { test, expect } from "@playwright/test";

async function openStudyTab(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("button", { name: "学习", exact: true }).click();
  await expect(page.getByRole("heading", { name: /学习中心/ })).toBeVisible();
}

test.describe("Study content loads on tab click", () => {
  test.beforeEach(async ({ page }) => {
    await openStudyTab(page);
  });

  test("语文 tab shows hanzi content", async ({ page }) => {
    await page.getByRole("button", { name: "语文", exact: true }).click();
    await expect(page.locator(".text-7xl")).toBeVisible({ timeout: 5000 });
  });

  test("数学 tab shows drill question", async ({ page }) => {
    await page.getByRole("button", { name: "数学", exact: true }).click();
    await expect(page.getByRole("button", { name: "确定" }).first()).toBeVisible({ timeout: 5000 });
  });

  test("阅读 tab shows story or joke text", async ({ page }) => {
    await page.getByRole("button", { name: "阅读", exact: true }).click();
    await expect(page.getByText(/📖 故事|😄 笑话/)).toBeVisible({ timeout: 5000 });
  });

  test("探索 tab shows explore tips", async ({ page }) => {
    await page.getByRole("button", { name: "探索", exact: true }).click();
    await expect(page.getByText(/试试说/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Voice bar UI", () => {
  test("shows tap-to-speak label", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("点击说话 · 长按连说")).toBeVisible();
  });
});

test.describe("Home grid navigation", () => {
  test("语文 shortcut loads content", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "语文" }).first().click();
    await expect(page.locator(".text-7xl")).toBeVisible({ timeout: 5000 });
  });

  test("数学 shortcut loads drill", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "数学" }).first().click();
    await expect(page.getByRole("button", { name: "确定" }).first()).toBeVisible({ timeout: 5000 });
  });
});
