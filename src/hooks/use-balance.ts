import { useQuery } from "@tanstack/react-query";

export function useBalance() {
  return useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) throw new Error("Error al obtener saldo");
      return res.json();
    },
    refetchInterval: 10000,
  });
}
