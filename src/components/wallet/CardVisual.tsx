"use client";

import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/lib/utils/format";

export default function CardVisual() {
  const { data } = useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) throw new Error("Error al obtener saldo");
      return res.json();
    },
  });

  if (!data) return null;

  return (
    <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-7 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--gradient-card)" }}
        >
          CT
        </div>
        <div>
          <p className="text-white text-sm font-semibold">
            {formatMoney(data.saldo)}
          </p>
          <p className="text-text-muted text-xs">{data.numero}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`px-2 py-0.5 rounded-full font-semibold ${
            data.activa
              ? "bg-success/20 text-success"
              : "bg-error/20 text-error"
          }`}
        >
          {data.activa ? "Activa" : "Inactiva"}
        </span>
      </div>
    </div>
  );
}
