"use client";

// 9×9 grid of given digits (sumi/black, immutable). 32 non-null entries.
export const GIVENS: ReadonlyArray<ReadonlyArray<number | null>> = [
  [1, null, 3, null, null, null, 7, null, 9],
  [null, 5, null, 7, null, 9, null, 2, null],
  [7, null, 9, null, null, null, null, null, 6],
  [null, 3, null, 5, null, 7, null, 9, null],
  [5, 6, null, null, 9, null, null, null, 4],
  [null, 9, null, null, null, 4, null, 6, null],
  [3, null, 5, null, null, null, 9, null, 2],
  [null, 7, null, 9, null, 2, null, null, null],
  [9, null, 2, null, null, null, null, null, 8],
];

// Cells already filled in vermillion when the cycle starts (visible from t=0). 13 entries.
export const START_PLACED: ReadonlyArray<{ r: number; c: number; value: number }> = [
  { r: 0, c: 4, value: 5 },
  { r: 1, c: 2, value: 6 },
  { r: 2, c: 3, value: 1 },
  { r: 2, c: 6, value: 4 },
  { r: 3, c: 4, value: 6 },
  { r: 4, c: 2, value: 7 },
  { r: 4, c: 6, value: 2 },
  { r: 5, c: 3, value: 2 },
  { r: 5, c: 8, value: 7 },
  { r: 6, c: 4, value: 7 },
  { r: 7, c: 2, value: 8 },
  { r: 7, c: 6, value: 3 },
  { r: 8, c: 4, value: 4 },
];

// Cells animated in, in solve order. 36 entries.
// Order jumps between 3×3 boxes the way constraint propagation does.
export const FILL_QUEUE: ReadonlyArray<{ r: number; c: number; value: number }> = [
  // Box top-left
  { r: 0, c: 1, value: 2 },
  { r: 1, c: 0, value: 4 },
  // Hop to top-middle
  { r: 1, c: 4, value: 8 },
  // Back to top-left
  { r: 2, c: 1, value: 8 },
  // Continue top-middle
  { r: 2, c: 4, value: 2 },
  { r: 2, c: 5, value: 3 },
  // Hop to top-right
  { r: 2, c: 7, value: 5 },
  { r: 1, c: 8, value: 3 },
  { r: 0, c: 7, value: 8 },
  { r: 1, c: 6, value: 1 },
  // Finish top-middle
  { r: 0, c: 3, value: 4 },
  { r: 0, c: 5, value: 6 },
  // Hop down to middle-right
  { r: 3, c: 8, value: 1 },
  { r: 3, c: 6, value: 8 },
  { r: 4, c: 7, value: 3 },
  { r: 5, c: 6, value: 5 },
  // Middle-middle
  { r: 4, c: 5, value: 1 },
  { r: 4, c: 3, value: 8 },
  { r: 5, c: 4, value: 3 },
  // Middle-left
  { r: 5, c: 2, value: 1 },
  { r: 5, c: 0, value: 8 },
  { r: 3, c: 2, value: 4 },
  { r: 3, c: 0, value: 2 },
  // Bottom-left
  { r: 6, c: 1, value: 4 },
  { r: 7, c: 0, value: 6 },
  { r: 8, c: 1, value: 1 },
  // Bottom-middle
  { r: 7, c: 4, value: 1 },
  { r: 6, c: 3, value: 6 },
  { r: 6, c: 5, value: 8 },
  { r: 8, c: 3, value: 3 },
  { r: 8, c: 5, value: 5 },
  // Bottom-right
  { r: 6, c: 7, value: 1 },
  { r: 8, c: 6, value: 6 },
  { r: 7, c: 7, value: 4 },
  { r: 8, c: 7, value: 7 },
  { r: 7, c: 8, value: 5 },
];

export interface AnimatedHeroBoardProps {
  seqLabel: string;
}

export function AnimatedHeroBoard(_props: AnimatedHeroBoardProps): JSX.Element | null {
  return null;
}
