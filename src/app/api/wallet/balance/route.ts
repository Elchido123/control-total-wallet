import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));

  if (!card) {
    return NextResponse.json({ saldo: 0, numero: "****" });
  }

  return NextResponse.json({
    saldo: card.saldo,
    numero: card.numero,
    titular: card.titular,
    limite: card.limite,
    activa: card.activa,
    bloqueada: card.bloqueada,
  });
}
