import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "juan@example.com");
    await page.fill('input[type="password"]', "1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("shows balance card", async ({ page }) => {
    await expect(page.locator("text=Mi Tarjeta")).toBeVisible();
    await expect(page.locator("text=MXN")).toBeVisible();
  });

  test("shows store grid", async ({ page }) => {
    await expect(page.locator("text=Tiendas Recomendadas")).toBeVisible();
    await expect(page.locator("text=Mercado Libre")).toBeVisible();
    await expect(page.locator("text=PayPal")).toBeVisible();
  });

  test("shows transaction list", async ({ page }) => {
    await expect(page.locator("text=Últimos Movimientos")).toBeVisible();
  });

  test("shows anti-fraud status", async ({ page }) => {
    await expect(page.locator("text=Hoy")).toBeVisible();
    await expect(page.locator("text=Cooldown")).toBeVisible();
    await expect(page.locator("text=Tarjeta")).toBeVisible();
  });

  test("quick actions navigate correctly", async ({ page }) => {
    await page.click("text=Enviar");
    await expect(page).toHaveURL(/\/dashboard\/stores/);
  });

  test("bottom navigation works", async ({ page }) => {
    await page.click('a[href="/dashboard/cards"]');
    await expect(page).toHaveURL(/\/cards/);

    await page.click('a[href="/dashboard/transactions"]');
    await expect(page).toHaveURL(/\/transactions/);

    await page.click('a[href="/dashboard/profile"]');
    await expect(page).toHaveURL(/\/profile/);
  });
});
