"use client";

import StoreGrid from "@/components/stores/StoreGrid";
import StatusIndicator from "@/components/antifraud/StatusIndicator";

export default function StoresPage() {
  return (
    <div className="space-y-5">
      <h2 className="text-white text-lg font-bold">🏪 Tiendas Disponibles</h2>
      <StatusIndicator />
      <StoreGrid />
    </div>
  );
}
