"use client";

import { useState, useMemo } from "react";
import { PRODUCTS, CATEGORIAS } from "@/lib/utils/products";
import { useCartStore } from "@/store/cart-store";
import CartDrawer from "@/components/shop/CartDrawer";
import { ShoppingBag, Plus } from "lucide-react";

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const { addItem, openCart, getItemCount } = useCartStore();

  const filtered = useMemo(
    () =>
      selectedCategory === "Todos"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.categoria === selectedCategory),
    [selectedCategory]
  );

  const itemCount = getItemCount();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tienda</h1>
          <p className="text-text-secondary text-sm">Productos digitales y físicos</p>
        </div>
        <button
          onClick={openCart}
          className="relative w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-primary-light transition-colors"
        >
          <ShoppingBag size={20} />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-light text-black text-[10px] font-bold flex items-center justify-center">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? "bg-primary-light text-black"
                : "bg-surface border border-border text-text-secondary hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-surface rounded-2xl border border-border p-4 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{product.icon}</span>
              {product.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    product.badge === "Premium" || product.badge === "Recomendado"
                      ? "bg-primary-light/20 text-primary-light"
                      : product.badge === "Nuevo"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {product.badge}
                </span>
              )}
            </div>
            <h3 className="text-white text-sm font-bold leading-tight">
              {product.nombre}
            </h3>
            <p className="text-text-secondary text-[11px] mt-1 line-clamp-1">
              {product.descripcion}
            </p>
            <div className="mt-auto pt-3 flex items-center justify-between">
              <span className="text-primary-light text-sm font-bold">
                ${product.precio.toLocaleString()}
              </span>
              <button
                onClick={() => {
                  addItem(product);
                  openCart();
                }}
                className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light hover:bg-primary-light hover:text-black transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CartDrawer />
    </div>
  );
}
