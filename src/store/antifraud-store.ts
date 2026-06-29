import { create } from "zustand";

interface AntifraudState {
  dailyUsage: number;
  cooldownActive: boolean;
  cooldownUntil: string | null;
  setStatus: (status: {
    dailyUsage: number;
    cooldownActive: boolean;
    cooldownUntil: string | null;
  }) => void;
}

export const useAntifraudStore = create<AntifraudState>((set) => ({
  dailyUsage: 0,
  cooldownActive: false,
  cooldownUntil: null,
  setStatus: (status) => set(status),
}));
