import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

class PaymentValidator {
  async checkDailyLimit(userId: number): Promise<ValidationResult> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allTx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const todayTx = allTx.filter(
      (t) => new Date(t.createdAt ?? "").getTime() > todayStart.getTime()
    );

    if (todayTx.length >= 2) {
      return {
        valid: false,
        reason: "Límite diario alcanzado (máximo 2 transacciones)",
      };
    }

    return { valid: true };
  }

  checkAmountLimit(monto: number): ValidationResult {
    if (monto > 19000) {
      return {
        valid: false,
        reason: `Monto excede el límite de $19,000 MXN`,
      };
    }
    return { valid: true };
  }
}

export { PaymentValidator };
