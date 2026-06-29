"use client";

import BalanceCard from "@/components/wallet/BalanceCard";
import StoreGrid from "@/components/stores/StoreGrid";
import TransactionList from "@/components/wallet/TransactionList";
import StatusIndicator from "@/components/antifraud/StatusIndicator";
import { useRouter } from "next/navigation";
import { Send, ShoppingBag, ArrowLeftRight, Receipt } from "lucide-react";

const quickActions = [
  { icon: ArrowLeftRight, label: "Transferir", color: "#FFD740", href: "/dashboard/transfer" },
  { icon: Send, label: "Enviar", color: "#00D2FF", href: "/dashboard/transfer" },
  { icon: ShoppingBag, label: "Tienda", color: "#FF6B8A", href: "/dashboard/shop" },
  { icon: Receipt, label: "Historial", color: "#FF6B8A", href: "/dashboard/transactions" },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <BalanceCard />

      <div className="flex justify-around px-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: action.color + "20" }}
              >
                <Icon size={22} style={{ color: action.color }} />
              </div>
              <span className="text-text-secondary text-[11px] font-semibold">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      <StatusIndicator />

      <StoreGrid />

      <TransactionList />

      <div className="h-4" />
    </div>
  );
}
