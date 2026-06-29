interface TemporalSnapshot {
  timestamp: number;
  fingerprintHash: string;
  proxyIp: string;
  componentsChanged: number;
}

interface TemporalCheckResult {
  passed: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}

export class TemporalGuard {
  private snapshots: Map<string, TemporalSnapshot> = new Map();
  private readonly MIN_INTERVAL_MS = 30 * 1000;
  private readonly MAX_INTERVAL_MS = 5 * 60 * 1000;
  private readonly MAX_COMPONENT_CHANGE = 3;
  private readonly TTL_MS = 15 * 60 * 1000;

  private snapshotCount: Map<string, number> = new Map();
  private readonly MAX_SNAPSHOTS_PER_USER = 10;

  private fingerprintComponents: Map<string, string[]> = new Map();

  validate(userId: string, currentFingerprint: string, proxyIp: string, components?: string[]): TemporalCheckResult {
    const previous = this.snapshots.get(userId);
    const now = Date.now();
    const reasons: string[] = [];
    const details: Record<string, unknown> = {};

    if (!previous) {
      this.snapshots.set(userId, {
        timestamp: now,
        fingerprintHash: currentFingerprint,
        proxyIp,
        componentsChanged: 0,
      });
      this.snapshotCount.set(userId, 1);
      if (components) {
        this.fingerprintComponents.set(userId, components);
      }
      return { passed: true };
    }

    const elapsed = now - previous.timestamp;

    if (previous.timestamp && elapsed < this.MIN_INTERVAL_MS) {
      reasons.push(`Intervalo demasiado corto: ${Math.round(elapsed / 1000)}s (mínimo ${this.MIN_INTERVAL_MS / 1000}s)`);
      details.minIntervalViolation = true;
    }

    if (elapsed > this.MAX_INTERVAL_MS) {
      reasons.push(`Intervalo demasiado largo: ${Math.round(elapsed / 60000)}min (máximo ${this.MAX_INTERVAL_MS / 60000}min)`);
      details.maxIntervalViolation = true;
    }

    if (previous.fingerprintHash && currentFingerprint !== previous.fingerprintHash) {
      let changeCount = 0;
      if (components && this.fingerprintComponents.has(userId)) {
        const prevComponents = this.fingerprintComponents.get(userId)!;
        changeCount = components.filter((c, i) => c !== prevComponents[i]).length;
        details.componentsChanged = changeCount;
      }

      if (changeCount > this.MAX_COMPONENT_CHANGE) {
        reasons.push(`Fingerprint cambió en ${changeCount} componentes, supera el límite de ${this.MAX_COMPONENT_CHANGE}`);
        details.fingerprintDrift = true;
      }
    }

    const count = this.snapshotCount.get(userId) ?? 0;
    if (count > this.MAX_SNAPSHOTS_PER_USER) {
      reasons.push(`Demasiadas transacciones en ventana temporal (${count})`);
      details.tooManySnapshots = true;
    }

    this.snapshots.set(userId, {
      timestamp: now,
      fingerprintHash: currentFingerprint,
      proxyIp,
      componentsChanged: 0,
    });
    this.snapshotCount.set(userId, count + 1);

    setTimeout(() => {
      const current = this.snapshots.get(userId);
      if (current && current.timestamp === now) {
        this.snapshots.delete(userId);
        this.snapshotCount.delete(userId);
        this.fingerprintComponents.delete(userId);
      }
    }, this.TTL_MS);

    return {
      passed: reasons.length === 0,
      reason: reasons.length > 0 ? reasons.join("; ") : undefined,
      details: Object.keys(details).length > 0 ? details : undefined,
    };
  }

  reset(userId: string): void {
    this.snapshots.delete(userId);
    this.snapshotCount.delete(userId);
    this.fingerprintComponents.delete(userId);
  }
}
