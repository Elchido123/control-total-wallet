export interface ProxyConfig {
  type: "mock" | "residential" | "datacenter" | "synthetic";
  ip: string;
  port: number;
  username?: string;
  password?: string;
  pais?: string;
  isp?: string;
  ciudad?: string;
}

export interface ProxyProvider {
  name: string;
  getNext(userId: string, excludeIps: Set<string>): Promise<ProxyConfig | null>;
  reportStatus(proxy: ProxyConfig, success: boolean): Promise<void>;
  getPoolSize(): number;
}
