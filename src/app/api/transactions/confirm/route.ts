import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CooldownManager } from "@/lib/anti-fraud/cooldown-manager";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { transactionId, status } = body;

  if (!transactionId || !["approved", "rejected"].includes(status)) {
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
    
    if ((card.saldo ?? 0) < (tx.monto ?? 0)) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
    }

    const nuevoSaldo = (card.saldo ?? 0) - (tx.monto ?? 0);
    await db.update(cards)
      .set({ saldo: nuevoSaldo })
      .where(eq(cards.id, card.id));

    await db.update(transactions)
      .set({ estado: "approved" })
      .where(eq(transactions.id, transactionId));

  } else {
    const [card] = tx.cardId
      ? await db.select().from(cards).where(eq(cards.id, tx.cardId))
      : [null];

    if (card) {
      const cooldown = new CooldownManager();
      await cooldown.activateCooldown(card.id);
    }

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
