import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

class PaymentGateway {
  async processPayment(transactionId: number): Promise<boolean> {
    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));

    if (!tx || !tx.cardId) return false;

    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, tx.cardId));

    if (!card || !card.activa || card.bloqueada) return false;

    await db.execute(sql`
      UPDATE cards SET saldo = saldo - ${tx.monto}
      WHERE id = ${tx.cardId} AND saldo >= ${tx.monto}
    `);

    await db.update(transactions)
      .set({ estado: "approved" })
      .where(eq(transactions.id, transactionId));

    return true;
  }

  async rejectPayment(transactionId: number): Promise<void> {
    await db.update(transactions)
      .set({ estado: "rejected" })
      .where(eq(transactions.id, transactionId));
  }
}

export { PaymentGateway };
