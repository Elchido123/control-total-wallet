export function formatMoney(amount: number): string {
  return (
    "$" +
    amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

export function safeUserId(id: string | undefined | null): number | null {
  if (!id) return null;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}
