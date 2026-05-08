import { describe, it, expect } from "vitest";
import { solve } from "@/lib/sudoku/solver";
import { isComplete, isValidPlacement } from "@/lib/sudoku/validate";
import { rc } from "@/lib/sudoku/types";

const parse = (s: string): number[] => s.split("").map((c) => (c === "." ? 0 : +c));

describe("solve", () => {
  it("solves an easy puzzle", () => {
    const p = parse(
      "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"
    );
    const out = solve(p);
    expect(out).not.toBeNull();
    expect(isComplete(out!)).toBe(true);
    out!.forEach((v, i) => {
      const [r, c] = rc(i);
      const tmp = [...out!]; tmp[i] = 0;
      expect(isValidPlacement(tmp, r, c, v)).toBe(true);
    });
  });

  it("returns null for unsolvable", () => {
    const p = parse(".".repeat(81));
    p[0] = 1; p[1] = 1; // duplicate in row
    expect(solve(p)).toBeNull();
  });
});
