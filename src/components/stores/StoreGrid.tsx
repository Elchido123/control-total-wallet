"use client";

import Link from "next/link";
import { STORES } from "@/lib/utils/stores";

export default function StoreGrid() {
  return (
    <div>
      <h3 className="text-white font-bold text-lg mb-3">🏪 Tiendas Recomendadas</h3>
      <div className="grid grid-cols-2 gap-3">
        {STORES.map((store) => (
          <Link
            key={store.id}
            href={`/dashboard/stores/${store.id}`}
            className="bg-surface rounded-xl p-4 border border-border border-l-4 flex items-center gap-2.5 hover:opacity-80 active:scale-[0.97] transition-all"
            style={{ borderLeftColor: store.color }}
          >
            <span className="text-3xl">{store.icon}</span>
            <div>
              <p className="text-white text-sm font-bold">{store.nombre}</p>
              <p className="text-text-secondary text-xs mt-0.5">
                {store.descripcion}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
