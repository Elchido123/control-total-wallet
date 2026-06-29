import { describe, it, expect } from "vitest";
import { CooldownManager } from "@/lib/anti-fraud/cooldown-manager";

describe("CooldownManager", () => {
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
