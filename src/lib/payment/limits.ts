export const DAILY_LIMIT = 2;
export const MAX_AMOUNT = 19000;
export const COOLDOWN_HOURS = 12;

export const LIMITS = {
  maxTransactionsPerDay: DAILY_LIMIT,
  maxAmountPerTransaction: MAX_AMOUNT,
  cooldownDurationHours: COOLDOWN_HOURS,
} as const;
