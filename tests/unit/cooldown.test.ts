import { describe, it, expect, vi, beforeEach } from "vitest";
import { CooldownManager } from "@/lib/anti-fraud/cooldown-manager";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

const { db } = await import("@/lib/db");

function mockDbSelectOnce(result: unknown) {
  (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
    from: vi.fn().mockReturnValueOnce({
      where: vi.fn().mockResolvedValueOnce(result),
    }),
  });
}

function mockDbUpdate() {
  (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
}

function mockDbDefault(result: unknown) {
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(result),
    }),
  });
}

const JITTER_RANGE_MS = 15 * 60 * 1000;

describe("CooldownManager constants", () => {
  it("has correct base cooldown duration", () => {
    expect(CooldownManager.BASE_COOLDOWN_MS).toBe(12 * 60 * 60 * 1000);
  });

  it("has correct max cooldown duration", () => {
    expect(CooldownManager.MAX_COOLDOWN_MS).toBe(48 * 60 * 60 * 1000);
  });

  it("has correct escalation factor", () => {
    expect(CooldownManager.ESCALATION_FACTOR).toBe(2);
  });
});

describe("CooldownManager.activateCooldown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbUpdate();
  });

  it("uses base/2 for first rejection (0 prior rejections) with jitter", async () => {
    mockDbSelectOnce([]);
    mockDbDefault([]);
    const cm = new CooldownManager();
    const result = await cm.activateCooldown(1);
    const expected = CooldownManager.BASE_COOLDOWN_MS / 2;
    expect(result.durationMs).toBeGreaterThanOrEqual(expected - JITTER_RANGE_MS);
    expect(result.durationMs).toBeLessThanOrEqual(expected + JITTER_RANGE_MS);
    expect(result.blockedUntil).toBeDefined();
  });

  it("uses base for second rejection (1 prior rejection) with jitter", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockDbSelectOnce([
      { id: 1, cardId: 1, estado: "rejected", createdAt: past },
    ]);
    mockDbDefault([]);
    const cm = new CooldownManager();
    const result = await cm.activateCooldown(1);
    const expected = CooldownManager.BASE_COOLDOWN_MS;
    expect(result.durationMs).toBeGreaterThanOrEqual(expected - JITTER_RANGE_MS);
    expect(result.durationMs).toBeLessThanOrEqual(expected + JITTER_RANGE_MS);
  });

  it("caps at MAX_COOLDOWN_MS for many rejections with jitter", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rejections = Array.from({ length: 10 }, (_, i) => ({
      id: i, cardId: 1, estado: "rejected", createdAt: past,
    }));
    mockDbSelectOnce(rejections);
    mockDbDefault([]);
    const cm = new CooldownManager();
    const result = await cm.activateCooldown(1);
    const expected = CooldownManager.MAX_COOLDOWN_MS;
    expect(result.durationMs).toBeGreaterThanOrEqual(expected - JITTER_RANGE_MS);
    expect(result.durationMs).toBeLessThanOrEqual(expected + JITTER_RANGE_MS);
  });
});

describe("CooldownManager.checkCooldown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns blocked: false when card is not blocked", async () => {
    mockDbSelectOnce([{ id: 1, bloqueada: false, bloqueadaHasta: null }]);
    mockDbDefault([]);
    const cm = new CooldownManager();
    const result = await cm.checkCooldown(1);
    expect(result.blocked).toBe(false);
    expect(result.remainingMs).toBe(0);
  });

  it("returns blocked: false when card does not exist", async () => {
    mockDbSelectOnce([]);
    mockDbDefault([]);
    const cm = new CooldownManager();
    const result = await cm.checkCooldown(999);
    expect(result.blocked).toBe(false);
    expect(result.remainingMs).toBe(0);
  });

  it("returns blocked: true when card is blocked with future date", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    mockDbSelectOnce([{ id: 1, bloqueada: true, bloqueadaHasta: future }]);
    mockDbSelectOnce([]);
    mockDbDefault([]);
    const cm = new CooldownManager();
    const result = await cm.checkCooldown(1);
    expect(result.blocked).toBe(true);
    expect(result.remainingMs).toBeGreaterThan(0);
  });

  it("auto-unblocks when bloqueadaHasta is in the past", async () => {
    mockDbUpdate();
    const past = new Date(Date.now() - 60 * 60 * 1000);
    mockDbSelectOnce([{ id: 1, bloqueada: true, bloqueadaHasta: past }]);
    mockDbDefault([]);
    const cm = new CooldownManager();
    const result = await cm.checkCooldown(1);
    expect(result.blocked).toBe(false);
    expect(result.remainingMs).toBe(0);
    expect(db.update).toHaveBeenCalled();
  });
});
