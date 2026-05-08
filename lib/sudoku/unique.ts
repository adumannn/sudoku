import { Board, SIZE, boxOf } from "./types";

export function countSolutions(board: Board, cap = 2): number {
  const b = board.slice();
  const rm = new Int32Array(SIZE), cm = new Int32Array(SIZE), bm = new Int32Array(SIZE);
  for (let i = 0; i < 81; i++) {
    const v = b[i]; if (!v) continue;
    const r = (i / SIZE) | 0, c = i % SIZE, bx = boxOf(r, c), bit = 1 << (v - 1);
    if (rm[r] & bit || cm[c] & bit || bm[bx] & bit) return 0;
    rm[r] |= bit; cm[c] |= bit; bm[bx] |= bit;
  }
  const empties: number[] = [];
  for (let i = 0; i < 81; i++) if (!b[i]) empties.push(i);
  let count = 0;
  const recurse = (k: number): boolean => {
    if (count >= cap) return true;
    if (k === empties.length) { count++; return count >= cap; }
    let bestK = k, bestCount = 10, bestMask = 0;
    for (let j = k; j < empties.length; j++) {
      const i = empties[j], r = (i / SIZE) | 0, c = i % SIZE, bx = boxOf(r, c);
      const free = 0x1ff & ~(rm[r] | cm[c] | bm[bx]);
      const cnt = popcount(free);
      if (cnt < bestCount) { bestCount = cnt; bestK = j; bestMask = free; if (cnt <= 1) break; }
    }
    if (bestCount === 0) return false;
    [empties[k], empties[bestK]] = [empties[bestK], empties[k]];
    const i = empties[k], r = (i / SIZE) | 0, c = i % SIZE, bx = boxOf(r, c);
    let mask = bestMask;
    while (mask) {
      const lsb = mask & -mask;
      const v = Math.log2(lsb) | 0;
      rm[r] |= lsb; cm[c] |= lsb; bm[bx] |= lsb; b[i] = v + 1;
      if (recurse(k + 1)) { rm[r] &= ~lsb; cm[c] &= ~lsb; bm[bx] &= ~lsb; b[i] = 0; [empties[k], empties[bestK]] = [empties[bestK], empties[k]]; return true; }
      rm[r] &= ~lsb; cm[c] &= ~lsb; bm[bx] &= ~lsb; b[i] = 0;
      mask &= mask - 1;
    }
    [empties[k], empties[bestK]] = [empties[bestK], empties[k]];
    return false;
  };
  recurse(0);
  return count;
}

const popcount = (x: number) => { let n = 0; while (x) { x &= x - 1; n++; } return n; };
