export function formatMoney(amount: number): string {
  const prefix = amount < 0 ? "-$" : "$";
  return (
    prefix +
    Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

export function safeUserId(id: string | undefined | null): number | null {
  if (!id) return null;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 && Number.isInteger(n) ? n : null;
}
