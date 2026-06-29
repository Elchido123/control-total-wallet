"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, CreditCard, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/utils/format";
import AddCardModal from "@/components/cards/AddCardModal";
import { useToast } from "@/components/ui/Toast";

export default function CardsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { addToast } = useToast();

  const { data: cardsList, refetch } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const res = await fetch("/api/cards");
      if (!res.ok) throw new Error("Error al obtener tarjetas");
      return res.json();
    },
  });

  const toggleCard = async (cardId: number, activa: boolean) => {
    const res = await fetch(`/api/cards/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !activa }),
    });
    if (!res.ok) {
      addToast("Error al cambiar estado de la tarjeta", "error");
      return;
    }
    addToast(
      activa ? "Tarjeta desactivada" : "Tarjeta activada",
      "success"
    );
    refetch();
  };

  const deleteCard = async (cardId: number) => {
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      addToast(data.error ?? "Error al eliminar la tarjeta", "error");
      return;
    }
    addToast("Tarjeta eliminada correctamente", "success");
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-bold">💳 Mis Tarjetas</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-primary/20 text-primary-light text-sm font-semibold px-4 py-2 rounded-xl border border-primary/30"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {(!cardsList || cardsList.length === 0) && (
        <div className="text-center py-16">
          <CreditCard size={48} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No tienes tarjetas registradas</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 text-primary-light font-semibold text-sm"
          >
            + Agregar primera tarjeta
          </button>
        </div>
      )}

      <div className="space-y-3">
        {Array.isArray(cardsList) &&
          cardsList.map((card: any) => (
            <div
              key={card.id}
              className="bg-surface rounded-2xl p-5 border border-border"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={18} className="text-primary-light" />
                    <span className="text-white font-bold text-base">
                      {card.numero}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs">
                    {card.titular} · {card.banco}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    card.activa
                      ? "bg-success/20 text-success"
                      : "bg-text-muted/20 text-text-muted"
                  }`}
                >
                  {card.activa ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-text-muted text-xs">Saldo</p>
                  <p className="text-white font-bold text-lg">
                    {formatMoney(card.saldo ?? 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-xs">Límite</p>
                  <p className="text-text-secondary font-semibold text-sm">
                    {formatMoney(card.limite ?? 0)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => toggleCard(card.id, card.activa)}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                    card.activa
                      ? "bg-warning/20 text-warning"
                      : "bg-success/20 text-success"
                  }`}
                >
                  {card.activa ? (
                    <ToggleRight size={14} />
                  ) : (
                    <ToggleLeft size={14} />
                  )}
                  {card.activa ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => deleteCard(card.id)}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-error/20 text-error"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
      </div>

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onAdded={() => { refetch(); setShowAdd(false); }} />}
    </div>
  );
}
