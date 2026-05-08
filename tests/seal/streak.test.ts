import { describe, it, expect } from "vitest";
import { computeUnifiedStreak } from "@/lib/seal/streak";

const TODAY = "2026-05-09";

describe("computeUnifiedStreak", () => {
  it("returns 0 with no completions and no freezes", () => {
    expect(computeUnifiedStreak(TODAY, new Set(), new Set())).toBe(0);
  });

  it("counts a single past day", () => {
    expect(computeUnifiedStreak(TODAY, new Set(["2026-05-08"]), new Set())).toBe(1);
  });

  it("counts today when today is completed", () => {
    expect(computeUnifiedStreak(TODAY, new Set([TODAY, "2026-05-08"]), new Set())).toBe(2);
  });

  it("does not break a streak just because today is incomplete", () => {
    // Today not played yet, but yesterday + before were
    expect(
      computeUnifiedStreak(
        TODAY,
        new Set(["2026-05-08", "2026-05-07", "2026-05-06"]),
        new Set(),
      ),
    ).toBe(3);
  });

  it("ends streak at the first gap", () => {
    expect(
      computeUnifiedStreak(
        TODAY,
        new Set(["2026-05-08", "2026-05-06", "2026-05-05"]),
        new Set(),
      ),
    ).toBe(1); // 5/7 missing → stops
  });

  it("treats a freeze as a kept day", () => {
    expect(
      computeUnifiedStreak(
        TODAY,
        new Set(["2026-05-08", "2026-05-06"]),
        new Set(["2026-05-07"]),
      ),
    ).toBe(3);
  });

  it("freezes today not yet played, with yesterday completed", () => {
    expect(
      computeUnifiedStreak(TODAY, new Set(["2026-05-08"]), new Set(["2026-05-09"])),
    ).toBe(2);
  });

  it("returns 0 if both today and yesterday are missing", () => {
    expect(
      computeUnifiedStreak(TODAY, new Set(["2026-05-06", "2026-05-05"]), new Set()),
    ).toBe(0);
  });

  it("caps walk-back at 730 days even with very long unbroken history", () => {
    const completed = new Set<string>();
    const d = new Date("2024-01-01T00:00:00Z");
    while (d <= new Date(TODAY + "T00:00:00Z")) {
      completed.add(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    expect(computeUnifiedStreak(TODAY, completed, new Set())).toBeLessThanOrEqual(730);
  });
});
