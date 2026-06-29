import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { CooldownManager } from "./cooldown-manager";
import { ProxyRotator } from "./proxy-rotator";
import { TemporalGuard } from "./temporal-guard";
import { dailyRateLimiter } from "./rate-limiter";
import { MAX_TRANSACTION_AMOUNT } from "@/lib/constants";

export interface PipelineCheck {
  name: string;
  passed: boolean;
  severity: "error" | "warning" | "info";
  message: string;
  details?: Record<string, unknown>;
}

export interface PipelineResult {
  passed: boolean;
  checks: PipelineCheck[];
  canProceed: boolean;
  proxyAssigned?: {
    ip: string;
    port: number;
    type: string;
  } | null;
  timedOut?: boolean;
}

interface PaymentRequest {
  userId: number;
  cardId?: number;
  monto: number;
  storeId?: string;
  deviceFingerprint?: string;
  fingerprintComponents?: string[];
  proxyIp?: string;
}

const PIPELINE_TIMEOUT_MS = 2000;

type PhaseResult = { passed: boolean; checks: PipelineCheck[] };

class FraudPipeline {
  private cooldown: CooldownManager;
  private rotator: ProxyRotator;
  private temporal: TemporalGuard;

  constructor() {
    this.cooldown = new CooldownManager();
    this.rotator = new ProxyRotator();
    this.temporal = new TemporalGuard();
  }

  private async phase1Parallel(req: PaymentRequest): Promise<PhaseResult> {
    const checks: PipelineCheck[] = [];

    const [card] = req.cardId
      ? await db.select().from(cards).where(eq(cards.id, req.cardId))
      : await db.select().from(cards).where(eq(cards.userId, req.userId));

    if (card && req.cardId && card.userId !== req.userId) {
      checks.push({
        name: "card_ownership",
        passed: false,
        severity: "error",
        message: "La tarjeta no pertenece al usuario",
      });
      return { passed: false, checks };
    }

    if (!card) {
      checks.push({
        name: "card_exists",
        passed: false,
        severity: "error",
        message: "No se encontró una tarjeta activa",
      });
      return { passed: false, checks };
    }

    checks.push({
      name: "card_exists",
      passed: true,
      severity: "info",
      message: "Tarjeta encontrada",
      details: { cardId: card.id, banco: card.banco },
    });

    if (!card.activa) {
      checks.push({
        name: "card_active",
        passed: false,
        severity: "error",
        message: "La tarjeta está inactiva",
      });
      return { passed: false, checks };
    }

    checks.push({
      name: "card_active",
      passed: true,
      severity: "info",
      message: "Tarjeta activa",
    });

    const cdStatus = await this.cooldown.checkCooldown(card.id);
    if (cdStatus.blocked) {
      checks.push({
        name: "cooldown",
        passed: false,
        severity: "error",
        message: cdStatus.reason ?? "Tarjeta en cooldown",
        details: {
          remainingMs: cdStatus.remainingMs,
          remainingHours: Math.ceil(cdStatus.remainingMs / 3600000),
          reason: cdStatus.reason,
        },
      });
      return { passed: false, checks };
    }

    checks.push({
      name: "cooldown",
      passed: true,
      severity: "info",
      message: "Sin cooldown activo",
    });

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayTx = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, req.userId),
          gte(transactions.createdAt, todayStart)
        )
      );

    const todayTxCount = todayTx.length;

    if (todayTxCount >= 2) {
      dailyRateLimiter.reset(String(req.userId));
      checks.push({
        name: "daily_limit",
        passed: false,
        severity: "error",
        message: "Límite diario alcanzado (máximo 2 transacciones)",
        details: { used: todayTxCount, max: 2 },
      });
      return { passed: false, checks };
    }

    checks.push({
      name: "daily_limit",
      passed: true,
      severity: "info",
      message: `Límite diario: ${todayTxCount}/2 usados`,
    });

    return { passed: true, checks };
  }

  private async phase2Sequential(req: PaymentRequest): Promise<PhaseResult> {
    const checks: PipelineCheck[] = [];

    const [card] = req.cardId
      ? await db.select().from(cards).where(eq(cards.id, req.cardId))
      : await db.select().from(cards).where(eq(cards.userId, req.userId));

    if (!card) {
      checks.push({
        name: "card_exists",
        passed: false,
        severity: "error",
        message: "Tarjeta no encontrada",
      });
      return { passed: false, checks };
    }

    if (req.monto > MAX_TRANSACTION_AMOUNT) {
      checks.push({
        name: "amount_limit",
        passed: false,
        severity: "error",
        message: `Monto excede el límite de $${MAX_TRANSACTION_AMOUNT.toLocaleString()} MXN`,
        details: { maxAllowed: MAX_TRANSACTION_AMOUNT, requested: req.monto },
      });
      return { passed: false, checks };
    }

    checks.push({
      name: "amount_limit",
      passed: true,
      severity: "info",
      message: `Monto dentro del límite ($${req.monto.toFixed(2)})`,
    });

    if ((card.saldo ?? 0) < req.monto) {
      checks.push({
        name: "sufficient_balance",
        passed: false,
        severity: "error",
        message: "Saldo insuficiente",
        details: { balance: card.saldo, needed: req.monto },
      });
      return { passed: false, checks };
    }

    checks.push({
      name: "sufficient_balance",
      passed: true,
      severity: "info",
      message: `Saldo suficiente ($${(card.saldo ?? 0).toFixed(2)})`,
    });

    return { passed: true, checks };
  }

  private async phase3Parallel(req: PaymentRequest): Promise<PhaseResult> {
    const checks: PipelineCheck[] = [];

    if (req.deviceFingerprint) {
      const temporalResult = this.temporal.validate(
        String(req.userId),
        req.deviceFingerprint,
        req.proxyIp ?? "",
        req.fingerprintComponents
      );

      if (!temporalResult.passed) {
        checks.push({
          name: "temporal_coherence",
          passed: false,
          severity: "warning",
          message: temporalResult.reason ?? "Inconsistencia temporal detectada",
          details: temporalResult.details,
        });
      } else {
        checks.push({
          name: "temporal_coherence",
          passed: true,
          severity: "info",
          message: "Coherencia temporal verificada",
        });
      }

      checks.push({
        name: "device_check",
        passed: true,
        severity: "info",
        message: "Fingerprint de dispositivo registrado",
        details: { fingerprint: req.deviceFingerprint.substring(0, 16) + "..." },
      });
    }

    const rotation = await this.rotator.rotateForTransaction(String(req.userId));

    checks.push({
      name: "proxy_rotation",
      passed: rotation.proxy !== null,
      severity: rotation.proxy ? "info" : "warning",
      message: rotation.proxy
        ? `Proxy asignado: ${rotation.proxy.ip}:${rotation.proxy.port} (${rotation.proxy.type})`
        : "No hay proxy disponible, continuando sin proxy",
      details: rotation.proxy ? { proxy: rotation.proxy } : undefined,
    });

    return { passed: true, checks };
  }

  async validate(req: PaymentRequest): Promise<PipelineResult> {
    const checks: PipelineCheck[] = [];
    const userIdStr = String(req.userId);

    const rateCheck = dailyRateLimiter.tryConsume(userIdStr);
    if (!rateCheck.allowed) {
      checks.push({
        name: "daily_limit",
        passed: false,
        severity: "error",
        message: "Límite diario alcanzado (máximo 2 transacciones)",
        details: { max: dailyRateLimiter.getMaxTokens() },
      });
      return { passed: false, checks, canProceed: false };
    }

    let phase1: PhaseResult;
    let timedOut = false;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Pipeline timeout")), PIPELINE_TIMEOUT_MS)
    );

    try {
      await Promise.race([
        (async () => {
          phase1 = await this.phase1Parallel(req);
        })(),
        timeoutPromise,
      ]);
    } catch {
      timedOut = true;
      dailyRateLimiter.reset(userIdStr);
      checks.push({
        name: "pipeline_timeout",
        passed: false,
        severity: "error",
        message: "Pipeline excedió el tiempo límite",
      });
      return { passed: false, checks, canProceed: false, timedOut: true };
    }

    checks.push(...phase1!.checks);
    if (!phase1!.passed) {
      return { passed: false, checks, canProceed: false };
    }

    const phase2 = await this.phase2Sequential(req);
    checks.push(...phase2.checks);
    if (!phase2.passed) {
      return { passed: false, checks, canProceed: false };
    }

    const phase3 = await this.phase3Parallel(req);
    checks.push(...phase3.checks);

    const allPassed = checks.every((c) => c.passed);
    const proxyCheck = checks.find((c) => c.name === "proxy_rotation");
    const proxyAssigned = proxyCheck?.details?.proxy as { ip: string; port: number; type: string } | undefined;

    return {
      passed: allPassed,
      checks,
      canProceed: allPassed,
      proxyAssigned,
      timedOut: false,
    };
  }

}

export { FraudPipeline };
