import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";
import { MAX_TRANSACTION_AMOUNT } from "@/lib/constants";

function isValidLuhn(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function isValidExpiry(exp: string): boolean {
  const match = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expiry = new Date(year, month, 0);
  return expiry > now;
}

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
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { numero, titular, expiracion, banco, limite } = body as { numero?: string; titular?: string; expiracion?: string; banco?: string; limite?: number };

  if (!numero || !titular || !expiracion) {
    return NextResponse.json(
      { error: "Faltan datos requeridos: número, titular, expiración" },
      { status: 400 }
    );
  }

  if (!isValidLuhn(numero)) {
    return NextResponse.json(
      { error: "Número de tarjeta inválido" },
      { status: 400 }
    );
  }

  if (!isValidExpiry(expiracion)) {
    return NextResponse.json(
      { error: "Fecha de expiración inválida o vencida" },
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
      banco: banco ?? "Otro",
      limite: limite ?? MAX_TRANSACTION_AMOUNT,
      saldo: 0,
    })
    .returning();

  return NextResponse.json(result);
}
