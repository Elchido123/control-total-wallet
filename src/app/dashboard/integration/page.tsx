"use client";

import { useState, useMemo } from "react";
import { BookmarkletSDK } from "@/lib/integration/bookmarklet-sdk";
import { Copy, Check, ExternalLink, Code, Puzzle } from "lucide-react";

export default function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const sdk = useMemo(
    () =>
      new BookmarkletSDK({
        appUrl: "https://app.controltotalwallet.com",
      }),
    []
  );

  const bookmarkletCode = sdk.generateCode();
  const instructions = sdk.getInstructions();
  const sites = sdk.getSupportedSites();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-white text-lg font-bold mb-1">
          🔗 Integración con Tiendas
        </h2>
        <p className="text-text-muted text-sm">
          Paga en cualquier tienda online usando tu wallet
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl">
            🔖
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">
              Bookmarklet de Pago
            </h3>
            <p className="text-text-muted text-xs">
              Arrastra este botón a tu barra de marcadores
            </p>
          </div>
        </div>

        <a
          href={bookmarkletCode}
          className="block w-full py-3.5 rounded-xl font-bold text-white text-center tracking-wide mb-3"
          style={{ background: "var(--gradient-card)" }}
          onClick={(e) => {
            setShowCode(!showCode);
          }}
        >
          💳 Pagar con CT Wallet
        </a>

        <p className="text-text-muted text-[11px] text-center">
          Arrastra este botón a la barra de marcadores
        </p>
      </div>

      {showCode && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
              <Code size={14} />
              Código del Bookmarklet
            </h3>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light"
            >
              {copied ? (
                <>
                  <Check size={14} /> Copiado
                </>
              ) : (
                <>
                  <Copy size={14} /> Copiar
                </>
              )}
            </button>
          </div>
          <p className="text-text-muted text-[11px] mb-2">
            Copia este código y créalo como marcador en tu navegador:
          </p>
          <code className="block bg-card border border-border rounded-xl p-3 text-[11px] text-text-secondary font-mono leading-relaxed break-all max-h-40 overflow-y-auto">
            {bookmarkletCode}
          </code>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Instrucciones</h3>
            <p className="text-text-muted text-xs">
              Sigue estos pasos para configurar el bookmarklet
            </p>
          </div>
        </div>
        <ol className="space-y-3">
          {instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary-light text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-text-secondary">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
            🏪
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">
              Tiendas Soportadas
            </h3>
            <p className="text-text-muted text-xs">
              {sites.length} tiendas disponibles
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sites.map((site) => (
            <a
              key={site.id}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-card rounded-xl p-3 border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {site.name}
                </p>
                <p className="text-text-muted text-[11px]">{site.category}</p>
              </div>
              <ExternalLink
                size={14}
                className="text-text-muted group-hover:text-primary-light transition-colors shrink-0"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
