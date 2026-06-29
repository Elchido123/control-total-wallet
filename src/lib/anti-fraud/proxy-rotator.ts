import { db } from "@/lib/db";
import { proxies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface ProxyConfig {
  type: "mock" | "residential" | "datacenter";
  ip: string;
  port: number;
  username?: string;
  password?: string;
  pais?: string;
}

interface ProxyHealth {
  proxy: ProxyConfig;
  lastCheck: number;
  successful: boolean;
  latencyMs: number;
  failCount: number;
}

class ProxyRotator {
  private pool: ProxyConfig[] = [];
  private currentIndex = 0;
  private healthMap: Map<string, ProxyHealth> = new Map();
  private circuitBreaker: Map<string, { failures: number; openedAt: number }> = new Map();
  private readonly CIRCUIT_THRESHOLD = 3;
  private readonly CIRCUIT_RESET_MS = 5 * 60 * 1000;

  constructor(pool?: ProxyConfig[]) {
    if (pool && pool.length > 0) {
      this.pool = pool;
    } else {
      this.pool = this.loadFromConfig();
    }
    if (this.pool.length === 0) {
      this.pool = this.getDefaultPool();
    }
  }

  private loadFromConfig(): ProxyConfig[] {
    try {
      const configPath = path.join(process.cwd(), "proxy-config.json");
      if (fs.existsSync(configPath)) {
        const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        return raw.proxies ?? [];
      }
    } catch {}
    return [];
  }

  private getDefaultPool(): ProxyConfig[] {
    return [
      { type: "mock", ip: "192.168.1.100", port: 3128, pais: "MX" },
      { type: "mock", ip: "192.168.1.101", port: 3128, pais: "MX" },
      { type: "mock", ip: "10.0.0.50", port: 8080, pais: "US" },
    ];
  }

  async syncFromDatabase(): Promise<void> {
    const dbProxies = await db.select().from(proxies).where(eq(proxies.activo, true));
    if (dbProxies.length > 0) {
      this.pool = dbProxies.map((p) => ({
        type: (p.tipo as ProxyConfig["type"]) ?? "datacenter",
        ip: p.ip,
        port: p.puerto ?? 3128,
        pais: p.pais ?? "MX",
      }));
    }
  }

  private getProxyKey(p: ProxyConfig): string {
    return `${p.ip}:${p.port}`;
  }

  private isCircuitOpen(key: string): boolean {
    const circuit = this.circuitBreaker.get(key);
    if (!circuit) return false;
    if (Date.now() - circuit.openedAt > this.CIRCUIT_RESET_MS) {
      this.circuitBreaker.delete(key);
      return false;
    }
    return circuit.failures >= this.CIRCUIT_THRESHOLD;
  }

  private markFailure(key: string): void {
    const circuit = this.circuitBreaker.get(key) ?? { failures: 0, openedAt: Date.now() };
    circuit.failures++;
    circuit.openedAt = Date.now();
    this.circuitBreaker.set(key, circuit);
  }

  async getNextProxy(options?: {
    pais?: string;
    tipo?: ProxyConfig["type"];
  }): Promise<ProxyConfig> {
    await this.syncFromDatabase();

    let candidates = this.pool.filter((p) => {
      const key = this.getProxyKey(p);
      return !this.isCircuitOpen(key);
    });

    if (candidates.length === 0) {
      this.circuitBreaker.clear();
      candidates = [...this.pool];
    }

    if (options?.pais) {
      const byCountry = candidates.filter((p) => p.pais === options.pais);
      if (byCountry.length > 0) candidates = byCountry;
    }

    if (options?.tipo) {
      const byType = candidates.filter((p) => p.type === options.tipo);
      if (byType.length > 0) candidates = byType;
    }

    const proxy = candidates[this.currentIndex % candidates.length];
    this.currentIndex++;
    return proxy;
  }

  async markFailed(proxy: ProxyConfig): Promise<void> {
    const key = this.getProxyKey(proxy);
    this.markFailure(key);
    await db.update(proxies)
      .set({ activo: false, ultimoUso: new Date().toISOString() })
      .where(eq(proxies.ip, proxy.ip));
  }

  async checkHealth(proxy: ProxyConfig): Promise<boolean> {
    const key = this.getProxyKey(proxy);
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch("http://httpbin.org/ip", {
        signal: controller.signal,
        ...(proxy.type === "mock"
          ? {}
          : {
              headers: {
                "Proxy-Authorization":
                  proxy.username && proxy.password
                    ? "Basic " + Buffer.from(`${proxy.username}:${proxy.password}`).toString("base64")
                    : "",
              },
            }),
      });
      clearTimeout(timeout);

      const latency = Date.now() - start;
      const healthy = response.ok;

      this.healthMap.set(key, {
        proxy,
        lastCheck: Date.now(),
        successful: healthy,
        latencyMs: latency,
        failCount: healthy ? 0 : (this.healthMap.get(key)?.failCount ?? 0) + 1,
      });

      return healthy;
    } catch {
      this.healthMap.set(key, {
        proxy,
        lastCheck: Date.now(),
        successful: false,
        latencyMs: Date.now() - start,
        failCount: (this.healthMap.get(key)?.failCount ?? 0) + 1,
      });
      return false;
    }
  }

  async rotateForTransaction(userId: string): Promise<{ proxy: ProxyConfig; rotated: boolean }> {
    await this.syncFromDatabase();
    const proxy = await this.getNextProxy({ pais: "MX" });
    return { proxy, rotated: true };
  }

  getPoolStats() {
    return {
      total: this.pool.length,
      healthy: this.pool.filter((p) => {
        const health = this.healthMap.get(this.getProxyKey(p));
        return health?.successful !== false;
      }).length,
      failed: this.circuitBreaker.size,
    };
  }
}

export { ProxyRotator };
export type { ProxyConfig };
