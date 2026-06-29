import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CooldownManager } from "@/lib/anti-fraud/cooldown-manager";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });

  const userCards = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));

  const card = userCards[0] ?? null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const allTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId));

  const todayTxCount = allTx.filter(
    (t) => new Date(t.createdAt ?? "").getTime() > todayStart.getTime()
  ).length;

  let cooldownActive = false;
  let cooldownUntil: string | null = null;
  let cooldownRemainingMs = 0;

  if (card) {
    const cooldown = new CooldownManager();
    const status = await cooldown.checkCooldown(card.id);
    cooldownActive = status.blocked;
    cooldownUntil = card.bloqueadaHasta ?? null;
    cooldownRemainingMs = status.remainingMs;
  }

  const recentRejections = card
    ? (await db
        .select()
        .from(transactions)
        .where(eq(transactions.cardId, card.id)))
        .filter((t) => t.estado === "rejected").length
    : 0;

  return NextResponse.json({
    dailyUsage: todayTxCount,
    dailyLimit: 2,
    cooldownActive,
    cooldownUntil,
    cooldownRemainingMs,
    cooldownEscalation: recentRejections,
    cardActive: card?.activa ?? false,
    cardBlocked: card?.bloqueada ?? false,
    cardCount: userCards.length,
    hasCard: card !== null,
  });
}
