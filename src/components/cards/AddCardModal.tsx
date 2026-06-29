"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddCardModal({ onClose, onAdded }: Props) {
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [expiracion, setExpiracion] = useState("");
  const [cvv, setCvv] = useState("");
  const [banco, setBanco] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, titular, expiracion, cvv, banco: banco || "Otro" }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al agregar tarjeta");
      } else {
        onAdded();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface rounded-2xl w-full max-w-sm border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">Agregar Tarjeta</h3>
          <button onClick={onClose}>
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-text-secondary text-xs font-semibold block mb-1">
              Número de tarjeta
            </label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="**** **** **** ****"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-primary-light"
              required
            />
          </div>

          <div>
            <label className="text-text-secondary text-xs font-semibold block mb-1">
              Titular
            </label>
            <input
              type="text"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="Nombre en la tarjeta"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-primary-light"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-secondary text-xs font-semibold block mb-1">
                Vencimiento
              </label>
              <input
                type="text"
                value={expiracion}
                onChange={(e) => setExpiracion(e.target.value)}
                placeholder="MM/AA"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-primary-light"
                required
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-semibold block mb-1">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="***"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-primary-light"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-text-secondary text-xs font-semibold block mb-1">
              Banco (opcional)
            </label>
            <input
              type="text"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Ej: BBVA, Santander"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-primary-light"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-semibold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white tracking-wide disabled:opacity-60"
            style={{ background: "var(--gradient-card)" }}
          >
            {loading ? "Guardando..." : "Agregar Tarjeta"}
          </button>
        </form>
      </div>
    </div>
  );
}
