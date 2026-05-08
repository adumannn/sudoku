import { describe, it, expect } from "vitest";
import { findHint, candidates } from "@/lib/sudoku/techniques";

const parse = (s: string) => s.split("").map((c) => (c === "." ? 0 : +c));

describe("candidates", () => {
  it("returns valid digits for an empty cell", () => {
    const b = parse(".".repeat(81));
    expect(candidates(b, 0)).toEqual([1,2,3,4,5,6,7,8,9]);
  });
});

describe("findHint", () => {
  it("finds a naked single", () => {
    const b = parse(
      "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"
    );
    const hint = findHint(b);
    expect(hint).not.toBeNull();
    expect(hint!.value).toBeGreaterThanOrEqual(1);
    expect(hint!.value).toBeLessThanOrEqual(9);
    expect(["naked-single","hidden-single","locked-candidate","naked-pair","hidden-pair","x-wing"]).toContain(hint!.technique);
  });

  it("returns null on a solved board", () => {
    const solved = parse("534678912672195348198342567859761423426853791713924856961537284287419635345286179");
    expect(findHint(solved)).toBeNull();
  });
});
