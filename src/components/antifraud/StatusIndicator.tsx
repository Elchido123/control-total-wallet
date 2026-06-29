"use client";

import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldOff, Clock, Activity, RefreshCw } from "lucide-react";

export default function StatusIndicator() {
  const { data, refetch } = useQuery({
    queryKey: ["antifraud-status"],
    queryFn: async () => {
      const res = await fetch("/api/antifraud/status");
      if (!res.ok) throw new Error("Error al obtener estado anti-fraud");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const { data: proxyStats } = useQuery({
    queryKey: ["proxy-stats"],
    queryFn: async () => {
      const res = await fetch("/api/antifraud/rotate-proxy");
      if (!res.ok) throw new Error("Error al rotar proxy");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const items = [
    {
      label: "Hoy",
      value: `${data?.dailyUsage ?? 0}/2`,
      color: (data?.dailyUsage ?? 0) >= 2 ? "text-error" : "text-success",
      icon: Activity,
    },
    {
      label: "Cooldown",
      value: data?.cooldownActive ? "Activo" : "Inactivo",
      color: data?.cooldownActive ? "text-warning" : "text-success",
      icon: Clock,
    },
    {
      label: "Tarjeta",
      value: data?.cardActive ? "Activa" : "Inactiva",
      color: data?.cardActive ? "text-success" : "text-error",
      icon: data?.cardActive ? Shield : ShieldOff,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-surface rounded-xl p-3 border border-border text-center"
            >
              <Icon
                size={14}
                className={`mx-auto mb-1 ${item.color}`}
              />
              <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider">
                {item.label}
              </p>
              <p className={`text-sm font-bold mt-0.5 ${item.color}`}>
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-surface/50 rounded-lg px-3 py-1.5 border border-border/50">
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <RefreshCw size={10} />
          <span>
            Proxies: {proxyStats?.healthy ?? "—"}/{proxyStats?.total ?? "—"} activos
          </span>
        </div>
        {data?.cooldownUntil && (
          <span className="text-warning text-[10px] font-semibold">
            hasta {new Date(data.cooldownUntil).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
