import { create } from "zustand";

interface AuthState {
  user: { id: string; name: string; email: string } | null;
  setUser: (user: { id: string; name: string; email: string } | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
