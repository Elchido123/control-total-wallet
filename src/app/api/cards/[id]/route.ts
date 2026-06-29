import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const cardId = safeUserId(id);
  if (!cardId) return NextResponse.json({ error: "ID de tarjeta inválido" }, { status: 400 });
  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId));

  if (!card || card.userId !== userId) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
  }

  return NextResponse.json(card);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const cardId = safeUserId(id);
  if (!cardId) return NextResponse.json({ error: "ID de tarjeta inválido" }, { status: 400 });
  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const body = await req.json();

  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId));

  if (!card || card.userId !== userId) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.activa !== undefined) updates.activa = body.activa;
  if (body.bloqueada !== undefined) updates.bloqueada = body.bloqueada;
  if (body.limite !== undefined) updates.limite = body.limite;
  if (body.saldo !== undefined) updates.saldo = body.saldo;
  if (body.banco !== undefined) updates.banco = body.banco;
  if (body.bloqueadaHasta !== undefined) updates.bloqueadaHasta = body.bloqueadaHasta;

  await db.update(cards)
    .set(updates)
    .where(eq(cards.id, cardId));

  const [updated] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId));

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const cardId = safeUserId(id);
  if (!cardId) return NextResponse.json({ error: "ID de tarjeta inválido" }, { status: 400 });
  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });

  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId));

  if (!card || card.userId !== userId) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
  }

  const [cardToDelete] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId));

  if (!cardToDelete) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
  }

  await db.update(transactions)
    .set({ cardId: null })
    .where(eq(transactions.cardId, cardId));

  await db.delete(cards).where(eq(cards.id, cardId));

  return NextResponse.json({ success: true });
}
