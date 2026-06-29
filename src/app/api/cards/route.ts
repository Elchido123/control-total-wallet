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
  const result = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const body = await req.json();
  const { numero, titular, expiracion, cvv, banco, limite } = body;

  if (!numero || !titular || !expiracion || !cvv) {
    return NextResponse.json(
      { error: "Faltan datos requeridos" },
      { status: 400 }
    );
  }

  const [result] = await db
    .insert(cards)
    .values({
      userId,
      numero,
      titular,
      expiracion,
      cvv,
      banco: banco ?? "Otro",
      limite: limite ?? 19000,
      saldo: 0,
    })
    .returning();

  return NextResponse.json(result);
}
