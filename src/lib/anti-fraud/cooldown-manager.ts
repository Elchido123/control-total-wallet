import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

interface CooldownStatus {
  blocked: boolean;
  remainingMs: number;
  reason?: string;
  cooldownHistory?: Array<{ start: string; end: string; reason: string }>;
}

class CooldownManager {
  static readonly BASE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
  static readonly MAX_COOLDOWN_MS = 48 * 60 * 60 * 1000;
  static readonly ESCALATION_FACTOR = 2;

  async checkCooldown(cardId: number): Promise<CooldownStatus> {
    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, cardId));

    if (!card || !card.bloqueada || !card.bloqueadaHasta) {
      return { blocked: false, remainingMs: 0 };
    }

    const remaining = new Date(card.bloqueadaHasta).getTime() - Date.now();
    if (remaining <= 0) {
      await db.update(cards)
        .set({ bloqueada: false, bloqueadaHasta: null })
        .where(eq(cards.id, cardId));
      return { blocked: false, remainingMs: 0 };
    }

    const recentRejections = (await db
      .select()
      .from(transactions)
      .where(eq(transactions.cardId, cardId)))
      .filter((t) => t.estado === "rejected")
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? "").getTime() -
          new Date(a.createdAt ?? "").getTime()
      );

    const history = recentRejections.slice(0, 5).map((t) => ({
      start: t.createdAt?.toISOString?.() ?? String(t.createdAt ?? ""),
      end: card.bloqueadaHasta ?? "",
      reason: t.concepto ?? "Pago rechazado",
    }));

    return {
      blocked: true,
      remainingMs: remaining,
      reason: `Cooldown activo por rechazo previo`,
      cooldownHistory: history,
    };
  }

  async activateCooldown(cardId: number): Promise<{ blockedUntil: string; durationMs: number }> {
    const recentRejections = (await db
      .select()
      .from(transactions)
      .where(eq(transactions.cardId, cardId)))
      .filter((t) => t.estado === "rejected");

    const rejectionCount = recentRejections.length;
    const cooldownMs = Math.min(
      CooldownManager.BASE_COOLDOWN_MS *
        Math.pow(CooldownManager.ESCALATION_FACTOR, rejectionCount - 1),
      CooldownManager.MAX_COOLDOWN_MS
    );

    const blockedUntil = new Date(Date.now() + cooldownMs).toISOString();

    await db.update(cards)
      .set({ bloqueada: true, bloqueadaHasta: blockedUntil })
      .where(eq(cards.id, cardId));

    return { blockedUntil, durationMs: cooldownMs };
  }

  async getCooldownForUser(userId: number): Promise<CooldownStatus> {
    const userCards = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, userId));

    for (const card of userCards) {
      const status = await this.checkCooldown(card.id);
      if (status.blocked) return status;
    }

    return { blocked: false, remainingMs: 0 };
  }

  async forceUnblock(cardId: number): Promise<void> {
    await db.update(cards)
      .set({ bloqueada: false, bloqueadaHasta: null })
      .where(eq(cards.id, cardId));
  }
}

export { CooldownManager };
