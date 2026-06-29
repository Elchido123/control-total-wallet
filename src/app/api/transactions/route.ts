import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { FraudPipeline } from "@/lib/anti-fraud/pipeline";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";
import { MAX_TRANSACTION_AMOUNT } from "@/lib/constants";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const estado = searchParams.get("estado");
  const limite = parseInt(searchParams.get("limite") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });

  const conditions = [eq(transactions.userId, userId)];
  if (tipo) conditions.push(eq(transactions.tipo, tipo));
  if (estado) conditions.push(eq(transactions.estado, estado));

  const result = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt))
    .limit(limite)
    .offset(offset);

  const totalRecords = await db
    .select()
    .from(transactions)
    .where(and(...conditions));
  const total = totalRecords.length;

  return NextResponse.json({ data: result, total, limit: limite, offset });
}

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
  const { storeId, monto, concepto, cardId } = body as { storeId?: string; monto?: number; concepto?: string; cardId?: number };

  if (!monto || monto <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  if (monto > MAX_TRANSACTION_AMOUNT) {
    return NextResponse.json(
      { error: `Monto excede el límite de $${MAX_TRANSACTION_AMOUNT.toLocaleString()} MXN` },
      { status: 400 }
    );
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });

  const pipeline = new FraudPipeline();
  const validation = await pipeline.validate({
    userId,
    cardId,
    monto,
    storeId,
  });

  if (!validation.canProceed) {
    const errorCheck = validation.checks.find((c) => !c.passed && c.severity === "error");
    return NextResponse.json(
      {
        error: errorCheck?.message ?? "Validación anti-fraud fallida",
        checks: validation.checks,
      },
      { status: 400 }
    );
  }

  const [card] = cardId
    ? await db.select().from(cards).where(eq(cards.id, cardId))
    : await db.select().from(cards).where(eq(cards.userId, userId));

  if (!card) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 400 });
  }

  await db.execute(sql`
    UPDATE cards SET saldo = saldo - ${monto}
    WHERE id = ${card.id} AND saldo >= ${monto}
  `);

  const [updatedCard] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, card.id));

  if (!updatedCard) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 400 });
  }

  if (updatedCard.saldo === card.saldo) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
  }

  const [result] = await db
    .insert(transactions)
    .values({
      userId,
      cardId: updatedCard.id,
      storeId,
      monto,
      concepto: concepto ?? "Pago en tienda",
      estado: "approved",
      tipo: "gasto",
    })
    .returning();

  if (!result) {
    return NextResponse.json({ error: "Transacción fallida" }, { status: 400 });
  }

  return NextResponse.json({
    ...result,
    nuevoSaldo: (updatedCard.saldo ?? 0),
    fraudChecks: validation.checks,
    proxyAssigned: validation.proxyAssigned,
  });
}
