// tests/seal/calendar.test.ts
import { describe, it, expect } from "vitest";
import { assignKanjiForRange } from "@/lib/seal/calendar";

describe("assignKanjiForRange", () => {
  it("assigns reserved kanji to special dates", () => {
    const out = assignKanjiForRange("2026-01-01", 1);
    expect(out[0].kanji).toBe("元");
    expect(out[0].date).toBe("2026-01-01");
  });

  it("assigns from the bank for non-reserved dates", () => {
    const out = assignKanjiForRange("2026-05-09", 1);
    expect(out[0].date).toBe("2026-05-09");
    expect(out[0].kanji.length).toBe(1);
    expect(out[0].romaji.length).toBeGreaterThan(0);
    expect(out[0].meaning.length).toBeGreaterThan(0);
  });

  it.todo("never repeats within a 365-day window — bank must be extended to ≥365 entries before this becomes runnable");

  it("is deterministic for the same input", () => {
    const a = assignKanjiForRange("2026-01-01", 30);
    const b = assignKanjiForRange("2026-01-01", 30);
    expect(a.map((e) => e.kanji)).toEqual(b.map((e) => e.kanji));
  });

  it("emits one entry per date in order", () => {
    const out = assignKanjiForRange("2026-05-09", 5);
    expect(out.map((e) => e.date)).toEqual([
      "2026-05-09",
      "2026-05-10",
      "2026-05-11",
      "2026-05-12",
      "2026-05-13",
    ]);
  });
});
