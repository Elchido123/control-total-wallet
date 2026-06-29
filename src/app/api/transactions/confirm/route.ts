import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { transactionId, status } = body as { transactionId?: number; status?: string };

  if (!transactionId || !["approved", "rejected"].includes(status ?? "")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId));

  if (!tx || tx.userId !== userId) {
    return NextResponse.json(
      { error: "Transacción no encontrada" },
      { status: 404 }
    );
  }

  if (tx.estado !== "pending") {
    return NextResponse.json(
      { error: "Transacción ya procesada" },
      { status: 400 }
    );
  }

  if (status === "approved") {
    const [card] = tx.cardId
      ? await db.select().from(cards).where(eq(cards.id, tx.cardId))
      : [null];

    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 400 });
    }
    
    await db.execute(sql`
      UPDATE cards SET saldo = saldo - ${tx.monto}
      WHERE id = ${card.id} AND saldo >= ${tx.monto}
    `);

    await db.update(transactions)
      .set({ estado: "approved" })
      .where(eq(transactions.id, transactionId));

  } else {
    await db.update(transactions)
      .set({ estado: "rejected" })
      .where(eq(transactions.id, transactionId));
  }

  const [updated] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId));

  return NextResponse.json(updated);
}
