import { useQuery } from "@tanstack/react-query";

export function useAntifraudStatus() {
  return useQuery({
    queryKey: ["antifraud-status"],
    queryFn: async () => {
      const res = await fetch("/api/antifraud/status");
      if (!res.ok) throw new Error("Error al obtener estado anti-fraud");
      return res.json();
    },
    refetchInterval: 30000,
  });
}
