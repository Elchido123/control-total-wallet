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
  constructor() {}

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

    const steps = Math.max(3, Math.floor(duration / 45000));
    for (let i = 0; i < steps; i++) {
      await this.randomDelay(3000, 7000);
    }

    if (clearCook) {
      await this.randomDelay(500, 1000);
    }
    return { success: true };
  }

  async cleanup(): Promise<void> {
  }
}

export { NavigationSimulator };
