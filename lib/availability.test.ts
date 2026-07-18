import { describe, it, expect } from "vitest";
import { retailStatus, isRetired, retailMinYear } from "./availability";

const NOW = new Date("2026-07-18T00:00:00Z");

describe("availability", () => {
  it("свежие наборы считаются продающимися", () => {
    expect(retailStatus(2026, NOW)).toBe("retail");
    expect(retailStatus(2025, NOW)).toBe("retail");
    expect(retailStatus(2024, NOW)).toBe("retail"); // 2 года — ещё может продаваться
  });
  it("наборы от трёх лет и старше считаются снятыми", () => {
    expect(retailStatus(2023, NOW)).toBe("retired");
    expect(retailStatus(1999, NOW)).toBe("retired");
  });
  it("isRetired — короткая форма того же правила", () => {
    expect(isRetired(2023, NOW)).toBe(true);
    expect(isRetired(2025, NOW)).toBe(false);
  });
  it("retailMinYear — граница для фильтра каталога, согласована с retailStatus", () => {
    expect(retailMinYear(NOW)).toBe(2024);
    expect(retailStatus(retailMinYear(NOW), NOW)).toBe("retail");
    expect(retailStatus(retailMinYear(NOW) - 1, NOW)).toBe("retired");
  });
});
