import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const body = await req.json();
  const { monto, concepto } = body;

  if (!monto || monto <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));

  if (!card) {
    return NextResponse.json(
      { error: "No tienes una tarjeta activa" },
      { status: 400 }
    );
  }

  const [cardLock] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, card.id));

  if (!cardLock) {
    return NextResponse.json(
      { error: "Tarjeta no encontrada" },
      { status: 400 }
    );
  }

  const nuevoSaldo = (cardLock.saldo ?? 0) + monto;
  
  await db.update(cards)
    .set({ saldo: nuevoSaldo })
    .where(eq(cards.id, card.id));

  await db.insert(transactions)
    .values({
      userId,
      cardId: card.id,
      monto,
      concepto: concepto ?? "Depósito a wallet",
      estado: "approved",
      tipo: "ingreso",
    });

  return NextResponse.json({
    success: true,
    saldo: nuevoSaldo,
    message: `Se agregaron $${monto.toFixed(2)} a tu saldo`,
  });
}
