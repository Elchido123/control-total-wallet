import { useQuery } from "@tanstack/react-query";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Error al obtener transacciones");
      return res.json();
    },
  });
}
