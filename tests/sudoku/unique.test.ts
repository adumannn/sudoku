import { describe, it, expect } from "vitest";
import { countSolutions } from "@/lib/sudoku/unique";

const parse = (s: string) => s.split("").map((c) => (c === "." ? 0 : +c));

describe("countSolutions", () => {
  it("returns 1 for a unique puzzle", () => {
    const p = parse(
      "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"
    );
    expect(countSolutions(p, 2)).toBe(1);
  });

  it("returns >=2 (short-circuit) for ambiguous puzzle", () => {
    expect(countSolutions(Array(81).fill(0), 2)).toBe(2);
  });
});
