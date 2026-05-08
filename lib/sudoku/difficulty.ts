import { Difficulty } from "./types";

export const DIFFICULTY = {
  easy:   { clues: [38, 42], minSeconds: 90 },
  medium: { clues: [32, 36], minSeconds: 180 },
  hard:   { clues: [27, 30], minSeconds: 360 },
  expert: { clues: [23, 26], minSeconds: 600 },
} as const satisfies Record<Difficulty, { clues: [number, number]; minSeconds: number }>;
