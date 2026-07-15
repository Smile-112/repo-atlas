import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("switches language and exposes scenario tools", async ({ page }) => {
  await page.getByRole("combobox", { name: "Language" }).selectOption("ru");
  await expect(page.getByRole("heading", { name: "Текущий портфель" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Инструменты сценария" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Отменить" })).toBeDisabled();
});

test("themes produce distinct workspace layouts", async ({ page }) => {
  const theme = page.getByRole("combobox", { name: "Theme" });
  const workspace = page.locator(".workspace");
  await theme.selectOption("atlas");
  const atlasColumns = await workspace.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  await theme.selectOption("ollama");
  await expect(workspace).toHaveCSS("display", "block");
  await theme.selectOption("claude");
  const claudeColumns = await workspace.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(claudeColumns).not.toBe(atlasColumns);
});

test("drags a repository between reversible groups and can undo", async ({ page }) => {
  await page.getByRole("button", { name: "Proposed map" }).click();
  const source = page.locator(".map-repository").filter({ hasText: "MM_Forge_mod" });
  const independent = page.locator(".map-group.independent");
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent("dragstart", { dataTransfer });
  await independent.dispatchEvent("dragenter", { dataTransfer });
  await independent.dispatchEvent("dragover", { dataTransfer });
  await independent.dispatchEvent("drop", { dataTransfer });
  await source.dispatchEvent("dragend", { dataTransfer });
  await expect(independent.locator(".map-repository").filter({ hasText: "MM_Forge_mod" })).toBeVisible();
  await page.getByRole("region", { name: "Scenario tools" }).getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".map-group").filter({ hasText: "minecraft-addons" }).locator(".map-repository").filter({ hasText: "MM_Forge_mod" })).toBeVisible();
});

test("keeps primary controls usable on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Current map" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select visible" })).toBeVisible();
  const moveControlWidth = await page.locator(".map-move").count().then(async (count) => {
    if (!count) await page.getByRole("button", { name: "Proposed map" }).click();
    return page.locator(".map-move").first().evaluate((element) => element.getBoundingClientRect().width);
  });
  expect(moveControlWidth).toBeGreaterThanOrEqual(44);
});

test("keeps advanced controls collapsed and shows one shared archive target", async ({ page }) => {
  const sources = page.locator("details.control-section > summary");
  await expect(page.getByRole("button", { name: "Import repositories" })).not.toBeVisible();
  await sources.click();
  await expect(page.getByRole("button", { name: "Import repositories" })).toBeVisible();
  await page.getByRole("button", { name: "Proposed map" }).click();
  await expect(page.locator(".map-group.archive").getByRole("heading", { name: "Archive monorepo" })).toBeVisible();
  await expect(page.locator(".map-group.archive").locator(".map-repository").filter({ hasText: "django-sprint4" })).toBeVisible();
});
