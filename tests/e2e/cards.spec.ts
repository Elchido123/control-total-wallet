import { test, expect } from "@playwright/test";

test.describe("Card Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "juan@example.com");
    await page.fill('input[type="password"]', "1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("shows cards page", async ({ page }) => {
    await page.click('a[href="/dashboard/cards"]');
    await expect(page.locator("text=Mis Tarjetas")).toBeVisible();
  });

  test("opens add card modal", async ({ page }) => {
    await page.goto("/dashboard/cards");
    await page.click("text=Agregar");
    await expect(page.locator("text=Agregar Tarjeta")).toBeVisible();
    await expect(page.locator('input[placeholder*="****"]')).toBeVisible();
  });

  test("adds a new card", async ({ page }) => {
    await page.goto("/dashboard/cards");
    await page.click("text=Agregar");

    await page.fill('input[placeholder*="****"]', "4111111111111111");
    await page.fill('input[placeholder*="Nombre en la tarjeta"]', "Test User");
    await page.fill('input[placeholder*="MM/AA"]', "12/28");

    await page.click("text=Agregar Tarjeta");
    await expect(page.locator("text=Agregar Tarjeta")).not.toBeVisible();
  });
});
