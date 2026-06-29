interface ProxyConfig {
  type: string;
  ip: string;
  port: number;
  username?: string;
  password?: string;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
];

const LOCALES = ["es-MX", "es-ES", "en-US", "es-US"];

interface NavigationOptions {
  targetUrl: string;
  proxy: ProxyConfig;
  duration?: number;
  clearCookies?: boolean;
  injectPayment?: boolean;
  paymentSelector?: string;
  paymentData?: Record<string, string>;
}

interface NavigationResult {
  success: boolean;
  screenshots?: string[];
  pageContent?: string;
  finalUrl?: string;
  error?: string;
}

class NavigationSimulator {
  private browser: any = null;
  private usePlaywright = false;

  constructor() {
    this.checkPlaywright();
  }

  private checkPlaywright(): void {
    try {
      require("playwright");
      this.usePlaywright = true;
    } catch {
      this.usePlaywright = false;
    }
  }

  getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  getRandomViewport(): { width: number; height: number } {
    return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
  }

  getRandomLocale(): string {
    return LOCALES[Math.floor(Math.random() * LOCALES.length)];
  }

  private async randomDelay(min = 3000, max = 7000): Promise<void> {
    const ms = min + Math.random() * (max - min);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async simulateHumanBehavior(
    targetUrl: string,
    proxy: ProxyConfig,
    options?: Partial<NavigationOptions>
  ): Promise<NavigationResult> {
    const duration = options?.duration ?? 15 * 60 * 1000;
    const clearCook = options?.clearCookies ?? true;

    if (this.usePlaywright) {
      return this.simulateWithPlaywright(targetUrl, proxy, duration, clearCook);
    }

    console.log(`[NavigationSim] Simulating navigation to ${targetUrl}`);
    console.log(`[NavigationSim] Proxy: ${proxy.ip}:${proxy.port} (${proxy.type})`);
    console.log(`[NavigationSim] User-Agent: ${this.getRandomUserAgent()}`);
    console.log(`[NavigationSim] Viewport: ${JSON.stringify(this.getRandomViewport())}`);
    console.log(`[NavigationSim] Locale: ${this.getRandomLocale()}`);
    console.log(`[NavigationSim] Duration: ${Math.round(duration / 60000)} minutes`);

    const steps = Math.max(3, Math.floor(duration / 45000));
    for (let i = 0; i < steps; i++) {
      const action = ["scroll", "hover", "wait", "click"][Math.floor(Math.random() * 4)];
      console.log(`[NavigationSim] Step ${i + 1}/${steps}: ${action}...`);
      await this.randomDelay(3000, 7000);
    }

    if (clearCook) {
      console.log("[NavigationSim] Clearing cookies and cache...");
      await this.randomDelay(500, 1000);
    }

    console.log("[NavigationSim] Navigation simulation complete");
    return { success: true };
  }

  private async simulateWithPlaywright(
    targetUrl: string,
    proxy: ProxyConfig,
    duration: number,
    clearCook: boolean
  ): Promise<NavigationResult> {
    try {
      const { chromium } = await import("playwright");

      const browser = await chromium.launch({
        headless: true,
        proxy: {
          server: `${proxy.ip}:${proxy.port}`,
          username: proxy.username,
          password: proxy.password,
        },
      });

      const context = await browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: this.getRandomViewport(),
        locale: this.getRandomLocale(),
        timezoneId: "America/Mexico_City",
        geolocation: { latitude: 19.4326, longitude: -99.1332 },
        permissions: ["geolocation"],
      });

      const page = await context.newPage();
      await page.goto(targetUrl, { waitUntil: "networkidle" });

      const endTime = Date.now() + duration;
      while (Date.now() < endTime) {
        await page.mouse.move(
          100 + Math.random() * 1700,
          100 + Math.random() * 900
        );
        await page.evaluate(() => {
          window.scrollBy(0, Math.random() * 300);
        });
        await page.waitForTimeout(3000 + Math.random() * 4000);

        const links = await page.locator("a, button").all();
        if (links.length > 0 && Math.random() > 0.7) {
          const randomLink = links[Math.floor(Math.random() * links.length)];
          try {
            await randomLink.click();
            await page.waitForTimeout(2000);
          } catch {}
        }
      }

      if (clearCook) {
        await context.clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }

      await browser.close();
      return { success: true, finalUrl: page.url() };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[NavigationSim] Playwright error:", message);
      return { success: false, error: message };
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export { NavigationSimulator };
