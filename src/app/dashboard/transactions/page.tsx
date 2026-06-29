"use client";

import TransactionList from "@/components/wallet/TransactionList";

export default function TransactionsPage() {
  return (
    <div>
      <h2 className="text-white text-lg font-bold mb-4">
        📊 Historial de Movimientos
      </h2>
      <TransactionList />
    </div>
  );
}
