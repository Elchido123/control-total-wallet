import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/utils/format";

describe("formatMoney", () => {
  it("formats whole numbers", () => {
    expect(formatMoney(1000)).toBe("$1,000.00");
  });

  it("formats decimal numbers", () => {
    expect(formatMoney(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("formats large numbers", () => {
    expect(formatMoney(1234567.89)).toBe("$1,234,567.89");
  });

  it("formats negative numbers", () => {
    expect(formatMoney(-500)).toBe("$-500.00");
  });
});
