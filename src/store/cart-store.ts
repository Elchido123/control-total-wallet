import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  nombre: string;
  precio: number;
  icon: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  total: number;
  itemCount: number;
  addItem: (product: { id: string; nombre: string; precio: number; icon: string }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  _recompute: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      total: 0,
      itemCount: 0,

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                nombre: product.nombre,
                precio: product.precio,
                icon: product.icon,
                quantity: 1,
              },
            ],
          });
        }
        get()._recompute();
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        get()._recompute();
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
        get()._recompute();
      },

      clearCart: () => {
        set({ items: [] });
        get()._recompute();
      },

      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotal: () => {
        return get().items.reduce(
          (sum, i) => sum + i.precio * i.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      _recompute: () => {
        const items = get().items;
        const total = items.reduce((sum, i) => sum + i.precio * i.quantity, 0);
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        set({ total, itemCount });
      },
    }),
    {
      name: "ctw-cart",
      partialize: (state) => ({ items: state.items, total: state.total, itemCount: state.itemCount }),
    }
  )
);
