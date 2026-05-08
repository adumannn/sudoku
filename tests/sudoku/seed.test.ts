import { describe, it, expect } from "vitest";
import { mulberry32, dateSeed } from "@/lib/sudoku/seed";

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
});

describe("dateSeed", () => {
  it("hashes a UTC date string to a stable 32-bit int", () => {
    expect(dateSeed("2026-05-08")).toBe(dateSeed("2026-05-08"));
    expect(dateSeed("2026-05-08")).not.toBe(dateSeed("2026-05-09"));
  });
});
