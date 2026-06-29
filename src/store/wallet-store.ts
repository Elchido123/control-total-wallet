import { create } from "zustand";

interface WalletState {
  balance: number;
  cardNumber: string;
  setBalance: (balance: number) => void;
  setCardNumber: (cardNumber: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  cardNumber: "****",
  setBalance: (balance) => set({ balance }),
  setCardNumber: (cardNumber) => set({ cardNumber }),
}));
