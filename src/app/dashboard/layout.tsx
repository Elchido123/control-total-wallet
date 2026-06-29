"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LogOut, Home, Store, User, Receipt, CreditCard, Puzzle, Activity, ArrowLeftRight } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/transfer", label: "Transferir", icon: ArrowLeftRight },
  { href: "/dashboard/stores", label: "Tiendas", icon: Store },
  { href: "/dashboard/cards", label: "Tarjetas", icon: CreditCard },
  { href: "/dashboard/transactions", label: "Movimientos", icon: Receipt },
  { href: "/dashboard/integration", label: "Integrar", icon: Puzzle },
  { href: "/dashboard/monitor", label: "Monitoreo", icon: Activity },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-light text-lg animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="pt-12 px-5 pb-2">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-text-secondary text-sm">Hola,</p>
            <p className="text-white text-xl font-bold">
              {session?.user?.name}{" "}
              <span role="img" aria-label="avatar">
                👤
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-accent transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-24">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-border px-5 py-3">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? "text-primary-light" : "text-text-muted"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
