"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function CooldownTimer() {
  const { data } = useQuery({
    queryKey: ["antifraud-status"],
    queryFn: async () => {
      const res = await fetch("/api/antifraud/status");
      if (!res.ok) throw new Error("Error al obtener estado anti-fraud");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!data?.cooldownUntil) {
      setRemaining("");
      return;
    }

    const interval = setInterval(() => {
      const diff = new Date(data.cooldownUntil).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("");
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setRemaining(`${h}h ${m}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.cooldownUntil]);

  if (!data?.cooldownActive) return null;

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
      <p className="text-warning font-bold text-sm">🔒 Tarjeta en Cooldown</p>
      <p className="text-warning/80 text-xs mt-1">
        Tiempo restante: {remaining}
      </p>
    </div>
  );
}
