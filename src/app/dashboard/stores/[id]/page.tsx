"use client";

import { useParams } from "next/navigation";
import { STORES } from "@/lib/utils/stores";
import PaymentForm from "@/components/stores/PaymentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StorePaymentPage() {
  const params = useParams();
  const store = STORES.find((s) => s.id === params.id);

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Tienda no encontrada</p>
        <Link
          href="/dashboard/stores"
          className="text-primary-light mt-4 inline-block"
        >
          Volver a tiendas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/stores"
        className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center mb-4"
      >
        <ArrowLeft size={20} className="text-white" />
      </Link>

      <div className="text-center py-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
          style={{ backgroundColor: store.color }}
        >
          {store.icon}
        </div>
        <h1 className="text-white text-2xl font-extrabold">{store.nombre}</h1>
        <p className="text-text-secondary text-sm mt-1">{store.descripcion}</p>
      </div>

      <PaymentForm store={store} />
    </div>
  );
}
