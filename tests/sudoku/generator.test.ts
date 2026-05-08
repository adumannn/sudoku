import { describe, it, expect } from "vitest";
import { generate } from "@/lib/sudoku/generator";
import { countSolutions } from "@/lib/sudoku/unique";
import { solve } from "@/lib/sudoku/solver";
import { DIFFICULTY } from "@/lib/sudoku/difficulty";

describe("generate", () => {
  for (const diff of ["easy","medium","hard","expert"] as const) {
    it(`produces a unique-solution ${diff} puzzle within clue range`, () => {
      const { givens, solution } = generate(diff, 12345);
      expect(givens).toHaveLength(81);
      expect(solution).toHaveLength(81);
      const board = givens.split("").map((c) => +c);
      const clues = board.filter((v) => v > 0).length;
      const [lo, hi] = DIFFICULTY[diff].clues;
      expect(clues).toBeGreaterThanOrEqual(lo);
      expect(clues).toBeLessThanOrEqual(hi);
      expect(countSolutions(board, 2)).toBe(1);
      const solved = solve(board)!.join("");
      expect(solved).toBe(solution);
    }, 30_000);
  }

  it("is deterministic for same seed", () => {
    const a = generate("easy", 42), b = generate("easy", 42);
    expect(a.givens).toBe(b.givens);
  });
});
