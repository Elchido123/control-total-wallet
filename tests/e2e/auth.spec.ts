import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login page with form", async ({ page }) => {
    await expect(page.locator("text=Control Total")).toBeVisible();
    await expect(page.locator("text=WALLET")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("shows error with invalid credentials", async ({ page }) => {
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrong");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Credenciales incorrectas")).toBeVisible();
  });

  test("logs in with valid credentials", async ({ page }) => {
    await page.fill('input[type="email"]', "juan@example.com");
    await page.fill('input[type="password"]', "1234");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Juan Pérez")).toBeVisible();
  });

  test("logs out successfully", async ({ page }) => {
    await page.fill('input[type="email"]', "juan@example.com");
    await page.fill('input[type="password"]', "1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto("/dashboard/profile");
    await page.click("text=Cerrar Sesión");
    await expect(page).toHaveURL(/\/login/);
  });
});
