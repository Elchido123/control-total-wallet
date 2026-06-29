import { ProxyConfig, ProxyProvider } from "../proxy-providers";

interface IpRange {
  start: number;
  end: number;
  isp: string;
  ciudades: string[];
}

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff,
  ].join(".");
}

const MX_ISP_RANGES: IpRange[] = [
  { start: ipToInt("187.188.0.0"), end: ipToInt("187.191.255.255"), isp: "Telmex", ciudades: ["CDMX", "Guadalajara", "Monterrey", "Puebla"] },
  { start: ipToInt("189.144.0.0"), end: ipToInt("189.159.255.255"), isp: "Telmex", ciudades: ["CDMX", "Querétaro", "Tijuana", "Mérida"] },
  { start: ipToInt("200.38.0.0"), end: ipToInt("200.38.255.255"), isp: "Izzi", ciudades: ["CDMX", "Estado de México", "Puebla", "Morelia"] },
  { start: ipToInt("201.130.0.0"), end: ipToInt("201.131.255.255"), isp: "Izzi", ciudades: ["Guadalajara", "Monterrey", "León", "Aguascalientes"] },
  { start: ipToInt("189.240.0.0"), end: ipToInt("189.243.255.255"), isp: "Totalplay", ciudades: ["CDMX", "Querétaro", "Cancún", "Toluca"] },
  { start: ipToInt("10.240.0.0"), end: ipToInt("10.243.255.255"), isp: "Megacable", ciudades: ["Guadalajara", "Hermosillo", "Culiacán", "Mexicali"] },
];

const POOL_SIZE = 100;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export class MxSyntheticProvider implements ProxyProvider {
  name = "mx-synthetic";
  private pool: ProxyConfig[] = [];
  private failureCounts: Map<string, number> = new Map();
  private healthyIps: Set<string> = new Set();

  constructor() {
    this.generatePool();
  }

  private generatePool(): void {
    const rng = seededRandom(Date.now());
    const ipsPerRange = Math.max(1, Math.floor(POOL_SIZE / MX_ISP_RANGES.length));

    for (const range of MX_ISP_RANGES) {
      const rangeSize = range.end - range.start;
      for (let i = 0; i < ipsPerRange; i++) {
        const offset = Math.floor(rng() * rangeSize);
        const ip = intToIp(range.start + offset);
        const ciudad = range.ciudades[Math.floor(rng() * range.ciudades.length)];
        this.pool.push({
          type: "synthetic",
          ip,
          port: 3128,
          pais: "MX",
          isp: range.isp,
          ciudad,
        });
        this.healthyIps.add(ip);
      }
    }
  }

  async getNext(userId: string, excludeIps: Set<string>): Promise<ProxyConfig | null> {
    const available = this.pool.filter(
      (p) => !excludeIps.has(p.ip) && this.healthyIps.has(p.ip) && (this.failureCounts.get(p.ip) ?? 0) < 3
    );

    if (available.length === 0) {
      const fallback = this.pool.filter((p) => !excludeIps.has(p.ip));
      if (fallback.length === 0) return this.pool[Math.floor(Math.random() * this.pool.length)] ?? null;
      return fallback[Math.floor(Math.random() * fallback.length)];
    }

    return available[Math.floor(Math.random() * available.length)];
  }

  async reportStatus(proxy: ProxyConfig, success: boolean): Promise<void> {
    if (!success) {
      const count = (this.failureCounts.get(proxy.ip) ?? 0) + 1;
      this.failureCounts.set(proxy.ip, count);
      if (count >= 3) {
        this.healthyIps.delete(proxy.ip);
      }
    } else {
      this.failureCounts.delete(proxy.ip);
      this.healthyIps.add(proxy.ip);
    }
  }

  getPoolSize(): number {
    return this.healthyIps.size;
  }
}
