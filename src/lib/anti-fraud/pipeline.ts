import { db } from "@/lib/db";
import { cards, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CooldownManager } from "./cooldown-manager";
import { ProxyRotator } from "./proxy-rotator";

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
  };
}

interface PaymentRequest {
  userId: number;
  cardId?: number;
  monto: number;
  storeId?: string;
  deviceFingerprint?: string;
}

class FraudPipeline {
  private cooldown: CooldownManager;
  private rotator: ProxyRotator;

  constructor() {
    this.cooldown = new CooldownManager();
    this.rotator = new ProxyRotator();
  }

  async validate(req: PaymentRequest): Promise<PipelineResult> {
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
      return { passed: false, checks, canProceed: false };
    }

    if (!card) {
      checks.push({
        name: "card_exists",
        passed: false,
        severity: "error",
        message: "No se encontró una tarjeta activa",
      });
      return { passed: false, checks, canProceed: false };
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
      return { passed: false, checks, canProceed: false };
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
        },
      });
      return { passed: false, checks, canProceed: false };
    }

    checks.push({
      name: "cooldown",
      passed: true,
      severity: "info",
      message: "Sin cooldown activo",
    });

    if (req.monto > 19000) {
      checks.push({
        name: "amount_limit",
        passed: false,
        severity: "error",
        message: `Monto excede el límite de $19,000 MXN`,
        details: { maxAllowed: 19000, requested: req.monto },
      });
      return { passed: false, checks, canProceed: false };
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
      return { passed: false, checks, canProceed: false };
    }

    checks.push({
      name: "sufficient_balance",
      passed: true,
      severity: "info",
      message: `Saldo suficiente ($${(card.saldo ?? 0).toFixed(2)})`,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allTx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, req.userId));

    const todayTxCount = allTx.filter(
      (t) => new Date(t.createdAt ?? "").getTime() > todayStart.getTime()
    ).length;

    if (todayTxCount >= 2) {
      checks.push({
        name: "daily_limit",
        passed: false,
        severity: "error",
        message: "Límite diario alcanzado (máximo 2 transacciones)",
        details: { used: todayTxCount, max: 2 },
      });
      return { passed: false, checks, canProceed: false };
    }

    checks.push({
      name: "daily_limit",
      passed: true,
      severity: "info",
      message: `Límite diario: ${todayTxCount}/2 usados`,
    });

    if (req.deviceFingerprint) {
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
      passed: true,
      severity: "info",
      message: `Proxy asignado: ${rotation.proxy.ip}:${rotation.proxy.port} (${rotation.proxy.type})`,
      details: { proxy: rotation.proxy },
    });

    const allPassed = checks.every((c) => c.passed);

    return {
      passed: allPassed,
      checks,
      canProceed: allPassed,
      proxyAssigned: rotation.proxy,
    };
  }
}

export { FraudPipeline };
