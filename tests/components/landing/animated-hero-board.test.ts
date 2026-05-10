import { describe, expect, it } from "vitest";
import {
  GIVENS,
  START_PLACED,
  FILL_QUEUE,
} from "@/components/landing/AnimatedHeroBoard";

function buildFinalGrid(): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = GIVENS[r][c];
      if (v !== null) grid[r][c] = v;
    }
  }
  for (const { r, c, value } of START_PLACED) {
    grid[r][c] = value;
  }
  for (const { r, c, value } of FILL_QUEUE) {
    grid[r][c] = value;
  }
  return grid;
}

describe("AnimatedHeroBoard puzzle data", () => {
  it("has 32 given cells", () => {
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (GIVENS[r][c] !== null) count++;
      }
    }
    expect(count).toBe(32);
  });

  it("has 13 start-placed cells and 36 queued cells", () => {
    expect(START_PLACED).toHaveLength(13);
    expect(FILL_QUEUE).toHaveLength(36);
  });

  it("has no overlap between GIVENS, START_PLACED, and FILL_QUEUE", () => {
    const seen = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (GIVENS[r][c] !== null) seen.add(`${r},${c}`);
      }
    }
    for (const { r, c } of START_PLACED) {
      const key = `${r},${c}`;
      expect(seen.has(key), `START_PLACED cell ${key} overlaps GIVENS`).toBe(false);
      seen.add(key);
    }
    for (const { r, c } of FILL_QUEUE) {
      const key = `${r},${c}`;
      expect(seen.has(key), `FILL_QUEUE cell ${key} overlaps`).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(81);
  });

  it("resolves to a valid sudoku solution", () => {
    const grid = buildFinalGrid();
    const expected = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Every row contains 1-9
    for (let r = 0; r < 9; r++) {
      expect(new Set(grid[r]), `row ${r}`).toEqual(expected);
    }
    // Every column contains 1-9
    for (let c = 0; c < 9; c++) {
      const col = grid.map((row) => row[c]);
      expect(new Set(col), `col ${c}`).toEqual(expected);
    }
    // Every 3×3 box contains 1-9
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box: number[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            box.push(grid[br * 3 + r][bc * 3 + c]);
          }
        }
        expect(new Set(box), `box ${br},${bc}`).toEqual(expected);
      }
    }
  });
});
