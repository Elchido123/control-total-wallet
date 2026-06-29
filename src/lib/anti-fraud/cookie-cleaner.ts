interface CleanupResult {
  cookiesCleared: number;
  storageCleared: boolean;
  cacheCleared: boolean;
  success: boolean;
}

class CookieCleaner {
  async cleanup(origin?: string): Promise<CleanupResult> {
    let cookiesCleared = 0;

    try {
      cookiesCleared = this.clearCookies(origin);
    } catch (e) { console.error("CookieCleaner: clearCookies failed", e); }

    let storageCleared = false;
    try {
      localStorage.clear();
      sessionStorage.clear();
      storageCleared = true;
    } catch (e) { console.error("CookieCleaner: localStorage/sessionStorage clear failed", e); }

    let cacheCleared = false;
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
        cacheCleared = true;
      }
    } catch (e) { console.error("CookieCleaner: cache clear failed", e); }

    return {
      cookiesCleared,
      storageCleared,
      cacheCleared,
      success: true,
    };
  }

  private clearCookies(origin?: string): number {
    let count = 0;
    const cookies = document.cookie.split(";").map((c) => c.trim().split("=")[0]);

    for (const name of cookies) {
      if (!name) continue;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${
        origin ? `domain=${new URL(origin).hostname};` : ""
      }`;
      count++;
    }

    return count;
  }

  async cleanupForPayment(targetUrl: string): Promise<CleanupResult> {
    const result = await this.cleanup(targetUrl);

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) { console.error("CookieCleaner: serviceWorker unregister failed", e); }

    return result;
  }

  getBrowserInfo(): {
    cookiesEnabled: boolean;
    localStorageEnabled: boolean;
    serviceWorkerSupported: boolean;
  } {
    return {
      cookiesEnabled: navigator.cookieEnabled,
      localStorageEnabled: typeof localStorage !== "undefined",
      serviceWorkerSupported: "serviceWorker" in navigator,
    };
  }
}

export { CookieCleaner };
