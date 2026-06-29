"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/lib/utils/format";
import { ExternalLink, Shield, ShieldOff, Clock } from "lucide-react";
import { MAX_TRANSACTION_AMOUNT } from "@/lib/constants";

interface Store {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  icon: string;
  url: string;
}

export default function PaymentForm({ store }: { store: Store }) {
  const router = useRouter();
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const { data: cardsList } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const res = await fetch("/api/cards");
      if (!res.ok) throw new Error("Error al obtener tarjetas");
      return res.json();
    },
  });

  const userCards: Array<{ id: number; numero: string; saldo: number; activa: boolean; banco: string | null }> =
    Array.isArray(cardsList) ? cardsList : [];

  const selectedCard = userCards.find((c) => c.id === selectedCardId) ?? userCards[0] ?? null;

  const { data: antifraud } = useQuery({
    queryKey: ["antifraud-status"],
    queryFn: async () => {
      const res = await fetch("/api/antifraud/status");
      if (!res.ok) throw new Error("Error al obtener estado anti-fraud");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const cooldownActive = antifraud?.cooldownActive;
  const dailyUsage = antifraud?.dailyUsage ?? 0;

  const handlePagar = async () => {
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (montoNum > MAX_TRANSACTION_AMOUNT) {
      setError(`El monto máximo por transacción es $${MAX_TRANSACTION_AMOUNT.toLocaleString()} MXN`);
      return;
    }
    if (!selectedCard) {
      setError("No hay tarjeta disponible");
      return;
    }
    if (montoNum > (selectedCard.saldo ?? 0)) {
      setError("Saldo insuficiente en la tarjeta seleccionada");
      return;
    }
    if (dailyUsage >= 2) {
      setError("Límite diario alcanzado (máximo 2 transacciones)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          monto: montoNum,
          concepto: concepto || `Pago en ${store.nombre}`,
          cardId: selectedCard.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al procesar el pago");
      } else {
        setSuccess(true);
        setMonto("");
        setConcepto("");
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-surface rounded-2xl p-8 border border-border text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-white font-bold text-lg mb-2">¡Pago Exitoso!</h3>
        <p className="text-text-secondary text-sm mb-4">
          El pago se ha procesado correctamente.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            router.refresh();
          }}
          className="text-primary-light font-semibold text-sm"
        >
          Volver a tiendas
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border">
      <h3 className="text-white font-bold text-lg mb-5">Realizar Pago</h3>

      {cooldownActive && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-3 flex items-center gap-2.5 mb-4">
          <Clock size={18} className="text-error shrink-0" />
          <div>
            <p className="text-error text-xs font-bold">
              🔒 Cooldown activo
            </p>
            <p className="text-error/70 text-[11px]">
              Espera 12h desde el último rechazo
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-surface-light rounded-lg px-3 py-1.5 border border-border">
          {dailyUsage >= 2 ? (
            <ShieldOff size={14} className="text-error" />
          ) : (
            <Shield size={14} className="text-success" />
          )}
          <span
            className={`text-xs font-semibold ${
              dailyUsage >= 2 ? "text-error" : "text-success"
            }`}
          >
            {dailyUsage}/2 hoy
          </span>
        </div>
        <span className="text-text-muted text-xs">
          Límite: {formatMoney(MAX_TRANSACTION_AMOUNT)}
        </span>
      </div>

      {userCards.length > 1 && (
        <div className="mb-4">
          <label className="text-text-secondary text-xs font-semibold block mb-1.5">
            Tarjeta a usar
          </label>
          <select
            value={selectedCard?.id ?? ""}
            onChange={(e) => setSelectedCardId(Number(e.target.value))}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-light transition-colors"
          >
            {userCards.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.activa}>
                {c.numero} — {c.banco ?? "Sin banco"} {!c.activa ? "(inactiva)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-card rounded-xl p-4 flex justify-between items-center mb-5 border border-border">
        <span className="text-text-secondary text-sm">Saldo disponible</span>
        <span className="text-success text-lg font-bold">
          {formatMoney(selectedCard?.saldo ?? 0)}
        </span>
      </div>

      <div className="mb-4">
        <label className="text-text-secondary text-xs font-semibold block mb-1.5">
          Monto a pagar
        </label>
        <div className="flex items-center bg-card rounded-xl border border-border px-3.5">
          <span className="text-text-secondary font-semibold text-lg mr-1">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-white text-lg font-semibold py-3.5 placeholder:text-text-muted focus:outline-none"
          />
          <span className="text-text-muted text-xs font-medium">MXN</span>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-text-secondary text-xs font-semibold block mb-1.5">
          Concepto (opcional)
        </label>
        <input
          type="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Descripción del pago"
          className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-primary-light transition-colors"
        />
      </div>

      {error && (
        <p className="text-error text-sm font-semibold text-center mb-3">
          {error}
        </p>
      )}

      <button
        onClick={handlePagar}
        disabled={loading || cooldownActive || dailyUsage >= 2}
        className="w-full py-3.5 rounded-xl font-bold text-white tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
        style={{ background: "var(--gradient-accent)" }}
      >
        {loading ? (
          "Procesando..."
        ) : cooldownActive ? (
          "🔒 Tarjeta bloqueada"
        ) : dailyUsage >= 2 ? (
          "⚠️ Límite diario alcanzado"
        ) : (
          "Pagar Ahora"
        )}
      </button>

      <a
        href={store.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3.5 mt-2.5 rounded-xl border border-primary-light/40 bg-primary-light/10 text-primary-light text-sm font-semibold"
      >
        <ExternalLink size={16} />
        Ir a la Tienda
      </a>
    </div>
  );
}
