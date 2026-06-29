import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq, gte, and } from "drizzle-orm";

export type CooldownReason =
  | "REJECTION"
  | "TEMPORAL_INCONSISTENCY"
  | "PROXY_HOP"
  | "FINGERPRINT_DRIFT"
  | "MANUAL";

interface CooldownStatus {
  blocked: boolean;
  remainingMs: number;
  reason?: string;
  cooldownReason?: CooldownReason;
  cooldownHistory?: Array<{ start: string; end: string; reason: string }>;
}

class CooldownManager {
  static readonly BASE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
  static readonly MAX_COOLDOWN_MS = 48 * 60 * 60 * 1000;
  static readonly ESCALATION_FACTOR = 2;
  static readonly JITTER_MIN_MS = -15 * 60 * 1000;
  static readonly JITTER_MAX_MS = 15 * 60 * 1000;

  private static applyJitter(baseMs: number): number {
    const jitter = CooldownManager.JITTER_MIN_MS +
      Math.random() * (CooldownManager.JITTER_MAX_MS - CooldownManager.JITTER_MIN_MS);
    return Math.max(60 * 1000, baseMs + jitter);
  }

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
        .set({ bloqueada: false, bloqueadaHasta: null, cooldownReason: null })
        .where(eq(cards.id, cardId));
      return { blocked: false, remainingMs: 0 };
    }

    const recentRejections = (await db
      .select()
      .from(transactions)
      .where(eq(transactions.cardId, cardId)))
      .filter((t) => t.estado === "rejected" && t.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() -
          new Date(a.createdAt!).getTime()
      );

    const history = recentRejections.slice(0, 5).map((t) => ({
      start: t.createdAt?.toISOString?.() ?? String(t.createdAt ?? ""),
      end: card.bloqueadaHasta?.toISOString() ?? "",
      reason: t.concepto ?? "Pago rechazado",
    }));

    return {
      blocked: true,
      remainingMs: remaining,
      reason: `Cooldown activo por rechazo previo`,
      cooldownReason: (card.cooldownReason as CooldownReason) ?? "REJECTION",
      cooldownHistory: history,
    };
  }

  async activateCooldown(
    cardId: number,
    reason: CooldownReason = "REJECTION"
  ): Promise<{ blockedUntil: string; durationMs: number; reason: CooldownReason }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRejections = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.cardId, cardId),
          eq(transactions.estado, "rejected"),
          gte(transactions.createdAt, thirtyDaysAgo)
        )
      );

    const rejectionCount = recentRejections.length;

    let factor = 1;
    if (reason === "TEMPORAL_INCONSISTENCY") factor = 1.5;
    else if (reason === "PROXY_HOP") factor = 1.5;
    else if (reason === "FINGERPRINT_DRIFT") factor = 1.5;

    const baseCooldown = Math.min(
      CooldownManager.BASE_COOLDOWN_MS *
        Math.pow(CooldownManager.ESCALATION_FACTOR, Math.max(0, rejectionCount - 1)) * factor,
      CooldownManager.MAX_COOLDOWN_MS
    );

    const cooldownMs = CooldownManager.applyJitter(baseCooldown);
    const blockedUntilDate = new Date(Date.now() + cooldownMs);
    const blockedUntil = blockedUntilDate.toISOString();

    await db.update(cards)
      .set({
        bloqueada: true,
        bloqueadaHasta: blockedUntilDate,
        cooldownReason: reason,
      })
      .where(eq(cards.id, cardId));

    return { blockedUntil, durationMs: cooldownMs, reason };
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
      .set({ bloqueada: false, bloqueadaHasta: null, cooldownReason: null })
      .where(eq(cards.id, cardId));
  }
}

export { CooldownManager };
