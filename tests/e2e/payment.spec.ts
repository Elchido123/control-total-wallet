import { test, expect } from "@playwright/test";

test.describe("Payment Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "juan@example.com");
    await page.fill('input[type="password"]', "1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("navigates to store payment page", async ({ page }) => {
    await page.click('a[href="/dashboard/stores"]');
    await expect(page.locator("text=Mercado Libre")).toBeVisible();
    await page.click("text=Mercado Libre");
    await expect(page).toHaveURL(/\/dashboard\/stores\/mercadolibre/);
    await expect(page.locator("text=Realizar Pago")).toBeVisible();
  });

  test("shows balance in payment form", async ({ page }) => {
    await page.goto("/dashboard/stores/mercadolibre");
    await expect(page.locator("text=Saldo disponible")).toBeVisible();
  });

  test("shows error for invalid amount", async ({ page }) => {
    await page.goto("/dashboard/stores/mercadolibre");
    await page.click("text=Pagar Ahora");
    await expect(page.locator("text=Ingresa un monto válido")).toBeVisible();
  });

  test("shows error for exceeding limit", async ({ page }) => {
    await page.goto("/dashboard/stores/mercadolibre");
    await page.fill('input[type="number"]', "20000");
    await page.click("text=Pagar Ahora");
    await expect(page.locator("text=límite")).toBeVisible();
  });

  test("processes valid payment", async ({ page }) => {
    await page.goto("/dashboard/stores/mercadolibre");
    await page.fill('input[type="number"]', "100");
    await page.fill('input[placeholder*="Descripción"]', "Test pago");
    await page.click("text=Pagar Ahora");
    await expect(page.locator("text=Pago Exitoso")).toBeVisible();
  });
});
