"use client";

import { useCartStore } from "@/store/cart-store";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, getTotal } =
    useCartStore();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  const total = items.reduce((sum, i) => sum + i.precio * i.quantity, 0);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const cardsRes = await fetch("/api/cards");
      const cardsData = await cardsRes.json();
      const cardsList = Array.isArray(cardsData?.data) ? cardsData.data : Array.isArray(cardsData) ? cardsData : [];
      const defaultCard = cardsList[0] ?? null;

      const concepto = items
        .map((i) => `${i.nombre} x${i.quantity}`)
        .join(", ");

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: total,
          concepto: `Shop: ${concepto}`,
          tipo: "purchase",
          storeId: "shop",
          cardId: defaultCard?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al procesar el pago");
        return;
      }

      clearCart();
      closeCart();
      router.push("/dashboard/transactions");
    } catch {
      alert("Error de conexión");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-surface z-50 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 pt-14 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary-light" />
              <h2 className="text-lg font-bold text-white">Carrito</h2>
              {items.length > 0 && (
                <span className="text-sm text-text-secondary">
                  ({items.reduce((s, i) => s + i.quantity, 0)})
                </span>
              )}
            </div>
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <ShoppingBag size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Tu carrito está vacío</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-background rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {item.nombre}
                        </p>
                        <p className="text-primary-light text-sm font-bold mt-0.5">
                          ${item.precio.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-text-secondary text-xs">Cantidad</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-white text-sm font-bold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border px-6 py-4 space-y-3 bg-background/50">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Total</span>
                <span className="text-white text-xl font-bold">
                  ${total.toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-3 rounded-xl bg-primary-light text-black font-bold text-sm hover:bg-primary-light/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <span className="animate-pulse">Procesando...</span>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Pagar con Wallet
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
