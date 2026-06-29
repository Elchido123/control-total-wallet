"use client";

import { useQuery } from "@tanstack/react-query";
import { Shield, Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function MonitorPage() {
  const { data: antifraud, refetch: refetchAF } = useQuery({
    queryKey: ["antifraud-status"],
    queryFn: async () => {
      const res = await fetch("/api/antifraud/status");
      if (!res.ok) throw new Error("Error al obtener estado anti-fraud");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: proxyStats } = useQuery({
    queryKey: ["proxy-stats"],
    queryFn: async () => {
      const res = await fetch("/api/antifraud/rotate-proxy");
      if (!res.ok) throw new Error("Error al rotar proxy");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: balance } = useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) throw new Error("Error al obtener saldo");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: recentTx } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions?limite=5");
      if (!res.ok) throw new Error("Error al obtener transacciones");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const txList = Array.isArray(recentTx?.data) ? recentTx.data : [];

  const metrics = [
    {
      label: "Estado Anti-Fraud",
      value: antifraud?.cooldownActive ? "🔒 Bloqueado" : "🟢 Normal",
      color: antifraud?.cooldownActive ? "text-warning" : "text-success",
    },
    {
      label: "Transacciones Hoy",
      value: `${antifraud?.dailyUsage ?? 0} / ${antifraud?.dailyLimit ?? 2}`,
      color: (antifraud?.dailyUsage ?? 0) >= 2 ? "text-error" : "text-success",
    },
    {
      label: "Saldo Actual",
      value: `$${(balance?.saldo ?? 0).toFixed(2)}`,
      color: (balance?.saldo ?? 0) > 0 ? "text-success" : "text-error",
    },
    {
      label: "Tarjeta Activa",
      value: antifraud?.cardActive ? "Sí" : "No",
      color: antifraud?.cardActive ? "text-success" : "text-error",
    },
    {
      label: "Proxies Saludables",
      value: `${proxyStats?.healthy ?? "—"} / ${proxyStats?.total ?? "—"}`,
      color: (proxyStats?.healthy ?? 0) > 0 ? "text-success" : "text-error",
    },
    {
      label: "Cooldown Escalation",
      value: `${antifraud?.cooldownEscalation ?? 0}x`,
      color: (antifraud?.cooldownEscalation ?? 0) > 0 ? "text-warning" : "text-success",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-lg font-bold">
            📊 Monitoreo Anti-Fraud
          </h2>
          <p className="text-text-muted text-xs">
            Actualizado en tiempo real cada 5s
          </p>
        </div>
        <button
          onClick={() => refetchAF()}
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-primary-light"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-surface rounded-xl p-4 border border-border"
          >
            <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider mb-1">
              {m.label}
            </p>
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Activity size={16} className="text-primary-light" />
          Últimas Transacciones
        </h3>
        {txList.length === 0 && (
          <p className="text-text-muted text-xs text-center py-4">
            Sin transacciones recientes
          </p>
        )}
        <div className="space-y-2">
          {txList.map((tx: any) => (
            <div
              key={tx.id}
              className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border"
            >
              <div className="flex items-center gap-2 min-w-0">
                {tx.estado === "approved" ? (
                  <CheckCircle size={14} className="text-success shrink-0" />
                ) : tx.estado === "rejected" ? (
                  <XCircle size={14} className="text-error shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-warning shrink-0" />
                )}
                <span className="text-white text-xs font-medium truncate">
                  {tx.concepto}
                </span>
              </div>
              <span className="text-text-muted text-[10px] shrink-0 ml-2">
                ${tx.monto?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
