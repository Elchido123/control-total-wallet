"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales incorrectas");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl"
          style={{ background: "var(--gradient-card)" }}
        >
          🔒
        </div>
        <h1 className="text-3xl font-extrabold tracking-wide text-white">
          Control Total
        </h1>
        <p className="text-xl font-light tracking-[0.2em] text-primary-light mt-1">
          WALLET
        </p>
        <div className="w-10 h-0.5 bg-primary-light rounded mx-auto mt-3" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass rounded-2xl p-7 border border-border space-y-5"
      >
        <p className="text-center text-white font-semibold">Iniciar Sesión</p>

        <div>
          <label className="text-sm text-text-secondary font-semibold block mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary-light transition-colors"
            required
          />
        </div>

        <div>
          <label className="text-sm text-text-secondary font-semibold block mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary-light transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-error text-sm font-semibold text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white tracking-wide transition-opacity disabled:opacity-60"
          style={{ background: "var(--gradient-accent)" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-text-muted text-xs uppercase tracking-wider mt-10">
        Solo usuarios autorizados
      </p>
    </div>
  );
}
