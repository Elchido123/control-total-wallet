import { db } from "@/lib/db";
import { proxies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProxyConfig, ProxyProvider } from "./proxy-providers";
import { MxSyntheticProvider } from "./providers/mx-synthetic";

interface CircuitState {
  failures: number;
  openedAt: number;
  countryFailures: Map<string, number>;
}

interface ProxyScore {
  ip: string;
  successCount: number;
  failCount: number;
  lastUsed: number;
}

class ProxyRotator {
  private providers: ProxyProvider[] = [];
  private circuitBreaker: Map<string, CircuitState> = new Map();
  private readonly CIRCUIT_THRESHOLD = 3;
  private readonly CIRCUIT_RESET_MS = 5 * 60 * 1000;
  private readonly COUNTRY_FAILURE_THRESHOLD = 0.5;
  private readonly COUNTRY_WINDOW_MS = 5 * 60 * 1000;

  private userProxyHistory: Map<string, string[]> = new Map();
  private readonly MAX_HISTORY_PER_USER = 3;

  private scores: Map<string, ProxyScore> = new Map();

  constructor() {
    const syntheticProvider = new MxSyntheticProvider();
    if (syntheticProvider.getPoolSize() > 0) {
      this.providers.push(syntheticProvider);
    }
  }

  async syncFromDatabase(): Promise<void> {
    const dbProxies = await db.select().from(proxies).where(eq(proxies.activo, true));
    if (dbProxies.length > 0) {
      for (const p of dbProxies) {
        const config: ProxyConfig = {
          type: (p.tipo as ProxyConfig["type"]) ?? "datacenter",
          ip: p.ip,
          port: p.puerto ?? 3128,
          pais: p.pais ?? "MX",
        };
      }
    }
  }

  private getProxyKey(p: ProxyConfig): string {
    return `${p.ip}:${p.port}`;
  }

  private getCountryCircuitState(country: string): CircuitState {
    const key = `country:${country}`;
    let state = this.circuitBreaker.get(key);
    if (!state) {
      state = { failures: 0, openedAt: 0, countryFailures: new Map() };
      this.circuitBreaker.set(key, state);
    } else if (Date.now() - state.openedAt > this.CIRCUIT_RESET_MS) {
      state.failures = 0;
      state.openedAt = 0;
    }
    return state;
  }

  private isCountryCircuitOpen(country: string): boolean {
    const state = this.getCountryCircuitState(country);
    if (state.failures === 0) return false;

    const recentFailures = Array.from(state.countryFailures.values());
    const total = recentFailures.length;
    const failed = recentFailures.filter((v) => v > 0).length;

    return total > 0 && (failed / total) >= this.COUNTRY_FAILURE_THRESHOLD;
  }

  private markCountryFailure(country: string): void {
    const state = this.getCountryCircuitState(country);
    state.failures++;
    const now = Date.now();
    for (const [ip, _] of state.countryFailures) {
      if (now - state.openedAt > this.COUNTRY_WINDOW_MS) {
        state.countryFailures.delete(ip);
      }
    }
    state.countryFailures.set(`failure_${now}`, 1);
    state.openedAt = now;
  }

  private markCountrySuccess(country: string): void {
    const state = this.getCountryCircuitState(country);
    state.failures = Math.max(0, state.failures - 1);
  }

  private getUserExcludeIps(userId: string): Set<string> {
    const history = this.userProxyHistory.get(userId) ?? [];
    return new Set(history);
  }

  private recordProxyForUser(userId: string, ip: string): void {
    let history = this.userProxyHistory.get(userId) ?? [];
    history.push(ip);
    if (history.length > this.MAX_HISTORY_PER_USER) {
      history = history.slice(history.length - this.MAX_HISTORY_PER_USER);
    }
    this.userProxyHistory.set(userId, history);
  }

  private updateScore(ip: string, success: boolean): void {
    let score = this.scores.get(ip);
    if (!score) {
      score = { ip, successCount: 0, failCount: 0, lastUsed: Date.now() };
      this.scores.set(ip, score);
    }
    if (success) {
      score.successCount++;
      score.failCount = Math.max(0, score.failCount - 1);
    } else {
      score.failCount++;
    }
    score.lastUsed = Date.now();
  }

  private getBestScore(proxies: ProxyConfig[]): number {
    if (proxies.length === 0) return 0;
    let best = -Infinity;
    for (const p of proxies) {
      const score = this.scores.get(p.ip);
      const value = score ? score.successCount - score.failCount * 5 : 0;
      if (value > best) best = value;
    }
    return best;
  }

  private selectByScore(proxies: ProxyConfig[]): ProxyConfig | null {
    if (proxies.length === 0) return null;
    let best = -Infinity;
    let bestProxy = proxies[0];
    for (const p of proxies) {
      const score = this.scores.get(p.ip);
      const value = score ? score.successCount - score.failCount * 5 : 0;
      if (value > best) {
        best = value;
        bestProxy = p;
      }
    }
    return bestProxy;
  }

  async getNextProxy(userId: string, options?: {
    pais?: string;
  }): Promise<ProxyConfig | null> {
    await this.syncFromDatabase();

    const pais = options?.pais ?? "MX";

    if (this.isCountryCircuitOpen(pais)) {
      return null;
    }

    const excludeIps = this.getUserExcludeIps(userId);

    for (const provider of this.providers) {
      const proxy = await provider.getNext(userId, excludeIps);
      if (proxy) {
        this.recordProxyForUser(userId, proxy.ip);
        return proxy;
      }
    }

    return null;
  }

  async markFailed(proxy: ProxyConfig): Promise<void> {
    this.markCountryFailure(proxy.pais ?? "MX");
    this.updateScore(proxy.ip, false);
    for (const provider of this.providers) {
      await provider.reportStatus(proxy, false);
    }
  }

  async markSuccess(proxy: ProxyConfig): Promise<void> {
    this.markCountrySuccess(proxy.pais ?? "MX");
    this.updateScore(proxy.ip, true);
    for (const provider of this.providers) {
      await provider.reportStatus(proxy, true);
    }
  }

  async rotateForTransaction(userId: string): Promise<{ proxy: ProxyConfig | null; rotated: boolean }> {
    const proxy = await this.getNextProxy(userId, { pais: "MX" });
    return { proxy, rotated: true };
  }

  getPoolStats() {
    const poolSize = this.providers.reduce((acc, p) => acc + p.getPoolSize(), 0);
    return {
      total: poolSize,
      healthy: poolSize,
      failed: this.circuitBreaker.size,
    };
  }

  getCircuitState(): Record<string, { open: boolean; failures: number }> {
    const states: Record<string, { open: boolean; failures: number }> = {};
    for (const [key, state] of this.circuitBreaker) {
      states[key] = {
        open: state.failures >= this.CIRCUIT_THRESHOLD,
        failures: state.failures,
      };
    }
    return states;
  }
}

export { ProxyRotator };
export type { ProxyConfig };
