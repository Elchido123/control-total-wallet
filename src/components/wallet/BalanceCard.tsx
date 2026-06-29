"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { formatMoney } from "@/lib/utils/format";

export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) throw new Error("Error al obtener saldo");
      return res.json();
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="h-48 rounded-2xl bg-surface animate-pulse border border-border" />
    );
  }

  if (isError) {
    return (
      <div className="h-48 rounded-2xl bg-error/10 border border-error/30 flex items-center justify-center">
        <p className="text-error text-sm font-semibold">Error al cargar saldo</p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-6 min-h-[200px] overflow-hidden"
      style={{ background: "var(--gradient-card)" }}
    >
      <div className="absolute w-[150px] h-[150px] rounded-full bg-white/5 -top-8 -right-8" />
      <div className="absolute w-[100px] h-[100px] rounded-full bg-white/5 -bottom-5 -left-5" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-5">
          <span className="text-white/90 font-semibold">💳 Mi Tarjeta</span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {showBalance ? <Eye size={22} /> : <EyeOff size={22} />}
          </button>
        </div>

        <p className="text-white/70 text-sm">Saldo disponible</p>
        <p className="text-white text-4xl font-bold tracking-wide">
          {showBalance ? formatMoney(data?.saldo ?? 0) : "••••••"}
        </p>
        <p className="text-white/60 text-sm mt-1 mb-4">MXN</p>

        <div className="flex justify-between items-center border-t border-white/20 pt-3">
          <span className="text-white/80 text-sm tracking-widest font-medium">
            {data?.numero ?? "**** **** **** ****"}
          </span>
          <span className="text-white/60 text-xs font-medium">
            {data?.titular ?? ""}
          </span>
        </div>
      </div>
    </div>
  );
}
