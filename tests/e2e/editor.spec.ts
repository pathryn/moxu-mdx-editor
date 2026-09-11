import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("loads the editor and opens controlled preview", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("文章标题")).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("实时预览").click();
  await expect(page.getByText("文章预览")).toBeVisible();
  await expect(page.getByText("把复杂内容写得更清楚", { exact: true }).last()).toBeVisible();
});

test("has no automatically detectable WCAG A/AA violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});
