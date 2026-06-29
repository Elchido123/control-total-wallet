"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/lib/utils/format";
import { Filter, ChevronDown } from "lucide-react";
import type { transactions } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Transaction = InferSelectModel<typeof transactions>;

export default function TransactionList() {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const params = new URLSearchParams();
  if (filtroTipo) params.set("tipo", filtroTipo);
  if (filtroEstado) params.set("estado", filtroEstado);
  params.set("limite", "20");

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", filtroTipo, filtroEstado],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Error al obtener transacciones");
      return res.json();
    },
  });

  const txList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const total = data?.total ?? txList.length;

  const statusColor = (estado: string) => {
    switch (estado) {
      case "approved": return "text-success";
      case "rejected": return "text-error";
      case "pending": return "text-warning";
      default: return "text-text-muted";
    }
  };

  const statusLabel = (estado: string) => {
    switch (estado) {
      case "approved": return "Aprobado";
      case "rejected": return "Rechazado";
      case "pending": return "Pendiente";
      case "blocked": return "Bloqueado";
      case "cooldown": return "En espera";
      default: return estado;
    }
  };

  if (isLoading) {
    return (
      <div>
        <h3 className="text-white font-bold text-lg mb-3">
          📊 Últimos Movimientos
        </h3>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-surface rounded-xl mb-2 animate-pulse border border-border"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-lg">
          📊 Últimos Movimientos
        </h3>
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            mostrarFiltros
              ? "bg-primary/20 border-primary/30 text-primary-light"
              : "bg-surface border-border text-text-muted"
          }`}
        >
          <Filter size={14} />
          Filtros
          <ChevronDown
            size={12}
            className={`transition-transform ${mostrarFiltros ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {mostrarFiltros && (
        <div className="flex gap-2 mb-3">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-primary-light"
          >
            <option value="">Todos los tipos</option>
            <option value="gasto">Gastos</option>
            <option value="ingreso">Ingresos</option>
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-primary-light"
          >
            <option value="">Todos los estados</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      )}

      {txList.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">
          No hay movimientos registrados
        </p>
      )}

      {txList.map((tx: Transaction) => {
        const isIncome = tx.tipo === "ingreso";
        return (
          <div
            key={tx.id}
            className="flex items-center bg-surface rounded-xl p-3.5 mb-2 border border-border"
          >
            <div
              className={`w-1 h-8 rounded-full mr-3 shrink-0 ${
                isIncome ? "bg-success" : "bg-accent"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold truncate">
                  {tx.concepto}
                </p>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${statusColor(tx.estado ?? "")} bg-current/10`}
                >
                  {statusLabel(tx.estado ?? "")}
                </span>
              </div>
              <p className="text-text-muted text-xs mt-0.5">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}</p>
            </div>
            <p
              className={`text-sm font-bold shrink-0 ml-3 ${
                isIncome ? "text-success" : "text-accent"
              }`}
            >
              {isIncome ? "+" : ""}
              {formatMoney(tx.monto)}
            </p>
          </div>
        );
      })}

      {total > 20 && (
        <p className="text-center text-text-muted text-xs mt-3">
          Mostrando 20 de {total} movimientos
        </p>
      )}
    </div>
  );
}
