"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface rounded-2xl border border-border p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-white font-bold text-lg mb-2">
          Algo salió mal
        </h2>
        <p className="text-text-muted text-sm mb-6">
          {error.message || "Ocurrió un error inesperado"}
        </p>
        <button
          onClick={reset}
          className="py-3 px-6 rounded-xl font-bold text-white tracking-wide"
          style={{ background: "var(--gradient-card)" }}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
