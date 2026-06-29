"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { LogOut, Edit2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Error al obtener perfil");
      return res.json();
    },
  });

  const { data: balance } = useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) throw new Error("Error al obtener saldo");
      return res.json();
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Error al obtener transacciones");
      return res.json();
    },
  });

  const txList = Array.isArray(transactions?.data ?? transactions) ? (transactions?.data ?? transactions) : [];

  const totalGastos = txList
    .filter((t: any) => t.tipo === "gasto")
    .reduce((a: number, t: any) => a + t.monto, 0);
  const totalIngresos = txList
    .filter((t: any) => t.tipo === "ingreso")
    .reduce((a: number, t: any) => a + t.monto, 0);

  const formatMoney = (n: number) =>
    "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const startEdit = () => {
    setNombre(userData?.nombre ?? "");
    setDireccion(userData?.direccion ?? "");
    setTelefono(userData?.telefono ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, direccion, telefono }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      update();
      setEditing(false);
    } catch {}
  };

  return (
    <div>
      <div className="text-center py-6 relative">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4"
          style={{ background: "var(--gradient-card)" }}
        >
          {userData?.avatar ?? "👤"}
        </div>
        <h1 className="text-white text-2xl font-extrabold">
          {userData?.nombre ?? session?.user?.name}
        </h1>
        <p className="text-text-muted text-sm mt-1 tracking-wider">
          ID: CTW-{(session?.user?.id ?? "").padStart(4, "0")}
        </p>
        <button
          onClick={startEdit}
          className="absolute top-2 right-2 w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-primary-light"
        >
          <Edit2 size={16} />
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-surface rounded-2xl p-4 border border-border text-center">
          <p className="text-text-secondary text-sm mb-1">Ingresos</p>
          <p className="text-success text-lg font-bold">
            {formatMoney(totalIngresos)}
          </p>
        </div>
        <div className="flex-1 bg-surface rounded-2xl p-4 border border-border text-center">
          <p className="text-text-secondary text-sm mb-1">Gastos</p>
          <p className="text-accent text-lg font-bold">
            {formatMoney(totalGastos)}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border divide-y divide-border mb-6">
        {[
          { label: "Email", value: userData?.email ?? "" },
          { label: "Teléfono", value: userData?.telefono ?? "—" },
          { label: "Dirección", value: userData?.direccion ?? "—" },
          { label: "Tarjeta", value: balance?.numero ?? "****" },
          { label: "Saldo", value: formatMoney(balance?.saldo ?? 0) },
          {
            label: "Movimientos",
            value: `${txList.length} registros`,
          },
          { label: "Estado", value: "Activa", valueColor: "text-success" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center px-4 py-3.5"
          >
            <span className="text-text-secondary text-sm">{item.label}</span>
            <span
              className={`text-white font-semibold text-sm ${
                item.valueColor ?? ""
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/cards"
        className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-primary/30 bg-primary/10 text-primary-light font-semibold text-sm mb-4"
      >
        💳 Gestionar Tarjetas
      </Link>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-accent/40 bg-accent/10 text-accent font-semibold"
      >
        <LogOut size={18} />
        Cerrar Sesión
      </button>

      <p className="text-text-muted text-xs text-center mt-5">
        Control Total Wallet v2.0.0
      </p>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-border p-6">
            <h3 className="text-white font-bold text-lg mb-4">
              Editar Perfil
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="text-text-secondary text-xs font-semibold block mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-light"
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs font-semibold block mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-light"
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs font-semibold block mb-1">
                  Dirección
                </label>
                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-light resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: "var(--gradient-card)" }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
