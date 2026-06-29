"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { setupPaymentBridge, CTW_ORIGIN } from "@/lib/integration/bridge";
import { formatMoney } from "@/lib/utils/format";

export default function PayPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "success" | "error">("loading");
  const [monto, setMonto] = useState("0");
  const [siteName, setSiteName] = useState("");
  const [returnUrl, setReturnUrl] = useState("");

  useEffect(() => {
    const bridge = setupPaymentBridge({
      async onCleanupRequest() {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if ("caches" in window) {
            const keys = await caches.keys();
            for (const key of keys) await caches.delete(key);
          }
        } catch {}
      },
    });

    setMonto(bridge.monto);
    setSiteName(bridge.siteName || bridge.site);
    setReturnUrl(bridge.returnUrl || "");
    setStatus("ready");

    return () => bridge.cleanup();
  }, []);

  const { data: balance } = useQuery({
    queryKey: ["pay-balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) throw new Error("Error al obtener saldo");
      return res.json();
    },
  });

  const handlePay = useCallback(async () => {
    setStatus("processing");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: siteName.toLowerCase().replace(/\s+/g, "-"),
          monto: parseFloat(monto),
          concepto: `Pago en ${siteName} vía bookmarklet`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");

        const iframeOrigin = CTW_ORIGIN;
        parent.postMessage(
          {
            type: "PAYMENT_RESULT",
            success: true,
            transactionId: data.id,
          },
          returnUrl || iframeOrigin
        );
      } else {
        setStatus("error");

        parent.postMessage(
          {
            type: "PAYMENT_RESULT",
            success: false,
            error: data.error ?? "Error al procesar el pago",
          },
          returnUrl || CTW_ORIGIN
        );
      }
    } catch {
      setStatus("error");
      parent.postMessage(
        { type: "PAYMENT_RESULT", success: false, error: "Error de conexión" },
        returnUrl || CTW_ORIGIN
      );
    }
  }, [monto, siteName, returnUrl]);

  const handleCancel = useCallback(() => {
    parent.postMessage(
      { type: "PAYMENT_RESULT", success: false, error: "Usuario canceló" },
      returnUrl || CTW_ORIGIN
    );
  }, [returnUrl]);

  const montoNum = parseFloat(monto) || 0;
  const saldoSuficiente = (balance?.saldo ?? 0) >= montoNum;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {status === "loading" && (
          <div className="text-center text-primary-light animate-pulse">
            Cargando...
          </div>
        )}

        {status === "ready" && (
          <div className="bg-surface rounded-2xl border border-border p-6">
            <div className="text-center mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ background: "var(--gradient-card)" }}
              >
                💳
              </div>
              <h1 className="text-white text-xl font-extrabold">
                Pagar con CT Wallet
              </h1>
              {siteName && (
                <p className="text-text-muted text-xs mt-1">{siteName}</p>
              )}
            </div>

            <div className="bg-card rounded-xl p-4 text-center mb-4 border border-border">
              <p className="text-text-muted text-xs mb-1">Monto a pagar</p>
              <p className="text-white text-3xl font-bold">
                {formatMoney(montoNum)}
              </p>
              <p className="text-text-muted text-xs mt-1">MXN</p>
            </div>

            <div className="flex items-center justify-between bg-card rounded-lg px-3 py-2 mb-5 border border-border">
              <span className="text-text-muted text-xs">Saldo disponible</span>
              <span
                className={`text-sm font-bold ${
                  saldoSuficiente ? "text-success" : "text-error"
                }`}
              >
                {formatMoney(balance?.saldo ?? 0)}
              </span>
            </div>

            <button
              onClick={handlePay}
              disabled={!saldoSuficiente}
              className="w-full py-3.5 rounded-xl font-bold text-white tracking-wide mb-2 disabled:opacity-40 transition-opacity"
              style={{ background: "var(--gradient-accent)" }}
            >
              {saldoSuficiente ? "Pagar Ahora" : "Saldo Insuficiente"}
            </button>

            <button
              onClick={handleCancel}
              className="w-full py-3 rounded-xl border border-border text-text-secondary font-semibold text-sm"
            >
              Cancelar
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="bg-surface rounded-2xl border border-border p-8 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-white font-bold">Procesando pago...</p>
            <p className="text-text-muted text-sm mt-1">
              Validando anti-fraud y descontando saldo
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-surface rounded-2xl border border-success/30 p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-white text-xl font-bold mb-2">
              ¡Pago Exitoso!
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              Se descontaron {formatMoney(montoNum)} de tu saldo
            </p>
            <p className="text-text-muted text-xs">
              Puedes cerrar esta ventana
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-surface rounded-2xl border border-error/30 p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-white text-xl font-bold mb-2">
              Pago Rechazado
            </h2>
            <p className="text-text-secondary text-sm mb-1">
              El pago no pudo procesarse
            </p>
            <button
              onClick={handlePay}
              className="mt-4 text-primary-light font-semibold text-sm"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
