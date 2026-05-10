# Animated Hero Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static sudoku preview in the signed-out marketing landing's hero panel with an animated time-lapse that fills the last 36 cells then stamps the `完` seal. Plays once on scroll-into-view; replays on re-entry.

**Architecture:** A new client component `AnimatedHeroBoard` owns the right-hand hero panel (the `bg-rice` framed preview). It holds three frozen arrays (`GIVENS`, `START_PLACED`, `FILL_QUEUE`), drives a `setTimeout` chain that increments `placedCount` every 250ms, then reveals the `完` seal. An `IntersectionObserver` gates play and triggers replay. `prefers-reduced-motion` short-circuits to the end state.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Tailwind, Vitest + React Testing Library. Reuses the existing `.hako-cell.ink-place` CSS animation in [app/globals.css](../../../app/globals.css) and the `VermillionStamp` component (currently inlined in `Landing.tsx`, extracted in Task 1).

---

## File Structure

**New files:**
- `components/landing/VermillionStamp.tsx` — shared stamp component, extracted from `Landing.tsx`.
- `components/landing/AnimatedHeroBoard.tsx` — the new animated panel. Self-contained: data + render + animation.
- `tests/components/landing/animated-hero-board.test.ts` — sanity test that the puzzle data resolves to a valid sudoku.

**Modified files:**
- `components/landing/Landing.tsx` — remove inline `VermillionStamp`, `HeroBoard`, `HERO_BOARD`, `HERO_PLAYER`, and the right-panel JSX block; render `<AnimatedHeroBoard seqLabel={...} />` instead. Re-import `VermillionStamp` from the new shared file (other usages in the file remain).
- `app/globals.css` — add `.hako-hero-seal` class + keyframe + reduced-motion override at the bottom of the `@layer components` block.

---

## Task 1: Extract `VermillionStamp` to a shared file

**Files:**
- Create: `components/landing/VermillionStamp.tsx`
- Modify: `components/landing/Landing.tsx:31-64` (remove the inline component and `STAMP_NOISE` constant; import from the new file)

- [ ] **Step 1: Create the shared component file**

Create `components/landing/VermillionStamp.tsx` with this exact content:

```tsx
const STAMP_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function VermillionStamp({
  glyph,
  size,
  fontSize,
  rotate,
  className,
}: {
  glyph: string;
  size: number;
  fontSize: number;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      className={
        "relative inline-flex items-center justify-center bg-vermillion text-bone mincho font-bold leading-none " +
        (className ?? "")
      }
      style={{
        width: size,
        height: size,
        fontSize,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <span className="relative z-10">{glyph}</span>
      <span
        aria-hidden
        className="absolute inset-0 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: STAMP_NOISE }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `Landing.tsx` to import the shared component**

In `components/landing/Landing.tsx`:

1. Add this import at the top, after the `import Link from "next/link";` line:
   ```tsx
   import { VermillionStamp } from "./VermillionStamp";
   ```
2. Remove the `STAMP_NOISE` constant declaration (currently lines 30-31).
3. Remove the entire `VermillionStamp` function declaration (currently lines 33-64).

The other helpers (`LockedStamp`, `HeroBoard`) remain untouched in this task.

- [ ] **Step 3: Verify build still passes**

Run: `cd /Users/duman/Desktop/sudoku/.claude/worktrees/gallant-gauss-c65aa5 && npx tsc --noEmit`
Expected: exits with code 0, no type errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/VermillionStamp.tsx components/landing/Landing.tsx
git commit -m "refactor(landing): extract VermillionStamp into its own file"
```

---

## Task 2: Add the seal-stamp CSS keyframe

**Files:**
- Modify: `app/globals.css` (append inside `@layer components`, near the existing `hako-ink-*` family at line ~300)

- [ ] **Step 1: Find the existing `hako-ink-bleed` keyframe block**

Open `app/globals.css` and locate the `@keyframes hako-ink-bleed` block (around line 291–300). The new class + keyframe go directly after the closing `}` of that keyframe, still inside the `@layer components` block.

- [ ] **Step 2: Insert the new class and keyframe**

Add this block immediately after the closing brace of `@keyframes hako-ink-bleed`:

```css
  .hako-hero-seal {
    animation: hako-hero-seal 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes hako-hero-seal {
    from {
      opacity: 0;
      transform: rotate(2deg) scale(1.35);
    }
    to {
      opacity: 1;
      transform: rotate(8deg) scale(1);
    }
  }
```

- [ ] **Step 3: Extend the existing reduced-motion override**

Locate the `@media (prefers-reduced-motion: reduce)` block in `globals.css` (around line 685–710). Inside that block, add:

```css
  .hako-hero-seal {
    animation: none;
  }
```

(Place it near the other `.hako-cell.ink-place` reduced-motion rules to keep related rules together.)

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style(landing): add hako-hero-seal keyframe for hero board seal"
```

---

## Task 3: Scaffold `AnimatedHeroBoard` with puzzle data and a sanity test

**Files:**
- Create: `components/landing/AnimatedHeroBoard.tsx` (skeleton — data only, component body is a placeholder)
- Create: `tests/components/landing/animated-hero-board.test.ts`

- [ ] **Step 1: Create the component skeleton with frozen data**

Create `components/landing/AnimatedHeroBoard.tsx` with this exact content:

```tsx
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
```

- [ ] **Step 2: Create the sanity test**

Create `tests/components/landing/animated-hero-board.test.ts` with this exact content:

```ts
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
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run tests/components/landing/animated-hero-board.test.ts`
Expected: all four tests pass.

If any test fails, the puzzle data has a typo — fix the offending entry in `AnimatedHeroBoard.tsx` and re-run.

- [ ] **Step 4: Commit**

```bash
git add components/landing/AnimatedHeroBoard.tsx tests/components/landing/animated-hero-board.test.ts
git commit -m "feat(landing): scaffold AnimatedHeroBoard with puzzle data + sanity test"
```

---

## Task 4: Render the board in its end state

This task makes `AnimatedHeroBoard` render the whole right-hand panel (matching the existing JSX shape in `Landing.tsx`), with all cells filled and the seal visible. No animation yet — the static `placedCount = FILL_QUEUE.length` and `sealVisible = true`.

**Files:**
- Modify: `components/landing/AnimatedHeroBoard.tsx`

- [ ] **Step 1: Replace the placeholder body**

In `components/landing/AnimatedHeroBoard.tsx`, replace the existing `AnimatedHeroBoard` function (currently `return null`) with this implementation. Add the import for `VermillionStamp` at the top of the file as well.

At the top of the file, immediately after `"use client";`, add:

```tsx
import { VermillionStamp } from "./VermillionStamp";
```

Then replace the function body:

```tsx
type CellRole =
  | { kind: "given"; value: number }
  | { kind: "placed-static"; value: number }
  | { kind: "queue"; value: number; queueIndex: number };

function buildRoleGrid(): CellRole[][] {
  const grid: (CellRole | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = GIVENS[r][c];
      if (v !== null) grid[r][c] = { kind: "given", value: v };
    }
  }
  for (const cell of START_PLACED) {
    grid[cell.r][cell.c] = { kind: "placed-static", value: cell.value };
  }
  FILL_QUEUE.forEach((cell, queueIndex) => {
    grid[cell.r][cell.c] = { kind: "queue", value: cell.value, queueIndex };
  });
  return grid as CellRole[][];
}

const ROLE_GRID = buildRoleGrid();
const GIVENS_COUNT = 32;
const START_PLACED_COUNT = 13;

export function AnimatedHeroBoard({ seqLabel }: AnimatedHeroBoardProps): JSX.Element {
  // Placeholder static state — animation is wired in Task 5.
  const placedCount = FILL_QUEUE.length;
  const sealVisible = true;

  const placed = GIVENS_COUNT + START_PLACED_COUNT + placedCount;
  const toGo = FILL_QUEUE.length - placedCount;

  const cells: JSX.Element[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const role = ROLE_GRID[r][c];
      let className = "hako-cell";
      let display: string | number = "·";

      if (role.kind === "given") {
        className += " given";
        display = role.value;
      } else if (role.kind === "placed-static") {
        className += " player";
        display = role.value;
      } else {
        // role.kind === "queue"
        if (role.queueIndex < placedCount) {
          className += " player";
          display = role.value;
          if (role.queueIndex === placedCount - 1) {
            className += " ink-place";
          }
        } else {
          className += " text-transparent";
        }
      }

      cells.push(
        <div key={`${r}-${c}`} className={className} style={{ cursor: "default" }}>
          {display}
        </div>,
      );
    }
  }

  return (
    <div
      className="relative px-8 pt-14 pb-12 lg:p-16 bg-rice flex flex-col justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
        <span className="mono text-[9.5px] tracking-[0.22em] uppercase text-moss">
          — preview · today&rsquo;s grid, mid-solve
        </span>
        <span className="mono text-[9.5px] tracking-[0.22em] uppercase text-moss">
          № {seqLabel}
        </span>
      </div>

      <div className="absolute top-[18px] right-[18px]">
        <VermillionStamp glyph="日" size={64} fontSize={34} rotate={8} />
      </div>

      <div className="mt-9 mx-auto w-full max-w-[440px] relative">
        <div className="hako-board">{cells}</div>

        {sealVisible && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <VermillionStamp
              glyph="完"
              size={140}
              fontSize={76}
              rotate={8}
              className="hako-hero-seal"
            />
          </div>
        )}
      </div>

      <div className="mt-6 text-center max-w-[440px] self-center ital text-[15px] text-moss leading-snug">
        — sumi numerals are <em className="text-vermillion-deep">given</em>;
        vermillion are <em className="text-vermillion-deep">yours</em>. The grid
        is the brand.
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end mono text-[9.5px] tracking-[0.18em] uppercase text-moss">
        <div>
          seed <strong className="text-sumi font-medium">7b3c</strong> ·{" "}
          <strong className="text-sumi font-medium">{placed}</strong> placed
        </div>
        <div>
          conflicts <strong className="text-sumi font-medium">0</strong> ·{" "}
          <strong className="text-sumi font-medium">{toGo}</strong> to go
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

- [ ] **Step 3: Run the sanity test again**

Run: `npx vitest run tests/components/landing/animated-hero-board.test.ts`
Expected: all four tests still pass (we didn't change the data).

- [ ] **Step 4: Commit**

```bash
git add components/landing/AnimatedHeroBoard.tsx
git commit -m "feat(landing): render AnimatedHeroBoard in static end state"
```

---

## Task 5: Wire the animation timing chain

Replace the hard-coded `placedCount = FILL_QUEUE.length` / `sealVisible = true` with state, and schedule the cell-by-cell fill + seal reveal via `setTimeout`. No visibility gating yet — the cycle just runs once on mount.

**Files:**
- Modify: `components/landing/AnimatedHeroBoard.tsx`

- [ ] **Step 1: Add React imports**

In `components/landing/AnimatedHeroBoard.tsx`, change the file header. Just after `"use client";`, replace the existing `import { VermillionStamp } from "./VermillionStamp";` line with:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { VermillionStamp } from "./VermillionStamp";
```

- [ ] **Step 2: Add timing constants below the data constants**

Just before `export interface AnimatedHeroBoardProps`, add:

```tsx
const TICK_MS = 250;
const SEAL_DELAY_MS = 500;
const FILL_TOTAL_MS = TICK_MS * FILL_QUEUE.length; // 9000ms
const CYCLE_TOTAL_MS = FILL_TOTAL_MS + SEAL_DELAY_MS + 380; // +seal animation
```

- [ ] **Step 3: Replace the placeholder state with real state and effect**

Inside the `AnimatedHeroBoard` function, replace the two `const` lines:

```tsx
  const placedCount = FILL_QUEUE.length;
  const sealVisible = true;
```

with:

```tsx
  const [placedCount, setPlacedCount] = useState(0);
  const [sealVisible, setSealVisible] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timeoutsRef.current) {
      window.clearTimeout(id);
    }
    timeoutsRef.current = [];
  }, []);

  const play = useCallback(() => {
    clearTimers();
    setPlacedCount(0);
    setSealVisible(false);

    for (let i = 1; i <= FILL_QUEUE.length; i++) {
      const id = window.setTimeout(() => setPlacedCount(i), TICK_MS * i);
      timeoutsRef.current.push(id);
    }
    const sealId = window.setTimeout(
      () => setSealVisible(true),
      FILL_TOTAL_MS + SEAL_DELAY_MS,
    );
    timeoutsRef.current.push(sealId);
  }, [clearTimers]);

  useEffect(() => {
    play();
    return clearTimers;
  }, [play, clearTimers]);
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add components/landing/AnimatedHeroBoard.tsx
git commit -m "feat(landing): animate AnimatedHeroBoard via setTimeout chain"
```

---

## Task 6: Gate playback with `IntersectionObserver` and reduced-motion

Convert the "play on mount" trigger into "play on visibility entry, replay on re-entry after the cycle has completed". Also short-circuit to the end state when `prefers-reduced-motion: reduce` is set.

The desired behavior:
- Initial mount in viewport → play once.
- Scroll away mid-cycle → cycle continues to completion (do not abort).
- Scroll back mid-cycle → ignore (already playing).
- Scroll away after completion → arm replay.
- Scroll back after that → replay.
- Reduced motion → snap directly to end state, ignore all observer events.

**Files:**
- Modify: `components/landing/AnimatedHeroBoard.tsx`

- [ ] **Step 1: Add a `containerRef` and lifecycle refs**

Inside the `AnimatedHeroBoard` function, immediately after the existing `const timeoutsRef = useRef<number[]>([]);` line, add:

```tsx
  const containerRef = useRef<HTMLDivElement>(null);
  const cycleStateRef = useRef<"idle" | "playing" | "rest">("idle");
  const armReplayRef = useRef(false);
```

- [ ] **Step 2: Update `play` to manage the cycle state**

Replace the existing `play` callback with:

```tsx
  const play = useCallback(() => {
    clearTimers();
    cycleStateRef.current = "playing";
    armReplayRef.current = false;
    setPlacedCount(0);
    setSealVisible(false);

    for (let i = 1; i <= FILL_QUEUE.length; i++) {
      const id = window.setTimeout(() => setPlacedCount(i), TICK_MS * i);
      timeoutsRef.current.push(id);
    }
    const sealId = window.setTimeout(
      () => setSealVisible(true),
      FILL_TOTAL_MS + SEAL_DELAY_MS,
    );
    timeoutsRef.current.push(sealId);
    const doneId = window.setTimeout(() => {
      cycleStateRef.current = "rest";
    }, CYCLE_TOTAL_MS);
    timeoutsRef.current.push(doneId);
  }, [clearTimers]);
```

- [ ] **Step 3: Replace the `useEffect` body**

Replace the existing `useEffect(() => { play(); return clearTimers; }, [play, clearTimers]);` block with:

```tsx
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPlacedCount(FILL_QUEUE.length);
      setSealVisible(true);
      cycleStateRef.current = "rest";
      return;
    }

    const el = containerRef.current;
    if (!el) return clearTimers;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (cycleStateRef.current === "idle") {
              play();
            } else if (cycleStateRef.current === "rest" && armReplayRef.current) {
              play();
            }
          } else if (cycleStateRef.current === "rest") {
            armReplayRef.current = true;
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, [play, clearTimers]);
```

- [ ] **Step 4: Attach `containerRef` to the outer wrapper**

In the JSX, find the outer wrapper:

```tsx
    <div
      className="relative px-8 pt-14 pb-12 lg:p-16 bg-rice flex flex-col justify-center overflow-hidden"
      aria-hidden="true"
    >
```

Change it to:

```tsx
    <div
      ref={containerRef}
      className="relative px-8 pt-14 pb-12 lg:p-16 bg-rice flex flex-col justify-center overflow-hidden"
      aria-hidden="true"
    >
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add components/landing/AnimatedHeroBoard.tsx
git commit -m "feat(landing): gate AnimatedHeroBoard on visibility, support reduced-motion"
```

---

## Task 7: Integrate `AnimatedHeroBoard` into `Landing.tsx`

Replace the static right-panel JSX (the `bg-rice` block with `HeroBoard` inside) with `<AnimatedHeroBoard seqLabel={seqLabel} />`. Remove the now-unused constants and the local `HeroBoard` function.

**Files:**
- Modify: `components/landing/Landing.tsx`

- [ ] **Step 1: Add the import**

In `components/landing/Landing.tsx`, after the existing `import { VermillionStamp } from "./VermillionStamp";` line, add:

```tsx
import { AnimatedHeroBoard } from "./AnimatedHeroBoard";
```

- [ ] **Step 2: Remove `HERO_BOARD` and `HERO_PLAYER` constants**

Delete the two declarations near the top of the file (originally lines 12–28):

```tsx
const HERO_BOARD: ReadonlyArray<ReadonlyArray<number | null>> = [ /* ... */ ];
const HERO_PLAYER: ReadonlySet<string> = new Set([ /* ... */ ]);
```

- [ ] **Step 3: Remove the local `HeroBoard` function**

Delete the `function HeroBoard() { ... }` declaration (originally around lines 85–105).

- [ ] **Step 4: Replace the right-panel JSX**

In the hero `<section>` (the `grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]` element), the right column is currently a `<div className="relative px-8 pt-14 pb-12 lg:p-16 bg-rice ...">` containing five children: the eyebrow, the 日 stamp, the board wrapper, the caption, and the counter strip.

Delete that entire `<div>` (from its opening tag through its closing `</div>`, originally lines 239–273). Replace it with a single line:

```tsx
        <AnimatedHeroBoard seqLabel={seqLabel} />
```

So the surrounding `<section>` now reads:

```tsx
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] border-b-[1.5px] border-sumi lg:min-h-[660px]">
        <div className="px-8 py-14 lg:px-16 lg:pt-20 lg:pb-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r-[1.5px] border-sumi">
          {/* …left-side hero copy unchanged… */}
        </div>

        <AnimatedHeroBoard seqLabel={seqLabel} />
      </section>
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass (existing + the new puzzle-data test).

- [ ] **Step 7: Commit**

```bash
git add components/landing/Landing.tsx
git commit -m "feat(landing): swap static HeroBoard for AnimatedHeroBoard"
```

---

## Task 8: Manual verification in the browser

The component is presentational. Final acceptance is visual. Run the dev server and verify the cycle plays, the seal stamps, the counter ticks, and the page is unaffected when signed in.

**Files:** none modified.

- [ ] **Step 1: Start the preview server**

Use `preview_start` (the project's standard `npm run dev` is the start command).

- [ ] **Step 2: Open the marketing landing (signed-out)**

Navigate to `/`. If the dev session is signed in, sign out first via `/auth/logout` or by clearing the relevant Supabase cookie.

- [ ] **Step 3: Verify the initial state**

`preview_snapshot` on the hero panel. Expect to see:
- The 9×9 board with 32 sumi givens and 13 vermillion start-placed digits.
- The bottom counter reads `45 placed` and `36 to go`.
- The 完 seal is NOT visible.

- [ ] **Step 4: Wait for the cycle to play**

After ~9.5 seconds, `preview_snapshot` again. Expect:
- All 81 cells filled (32 sumi + 49 vermillion).
- The 完 seal visible, rotated.
- Counter reads `81 placed` and `0 to go`.

- [ ] **Step 5: Check the console for errors**

`preview_console_logs`. Expect no errors related to `AnimatedHeroBoard`, no `setState on unmounted` warnings, no `IntersectionObserver` reference errors.

- [ ] **Step 6: Test replay by scrolling**

`preview_eval` with `window.scrollTo({ top: 2000, behavior: 'instant' })` to scroll the hero out of view. Wait 500ms. Then `preview_eval` with `window.scrollTo({ top: 0, behavior: 'instant' })`. After ~1 second, `preview_snapshot` — expect the counter to be ticking again from a lower number (replay in progress).

- [ ] **Step 7: Test reduced-motion (Chrome DevTools emulation)**

In the preview's DevTools (open via the preview UI), go to: ⋮ menu → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → set to "prefers-reduced-motion: reduce".

Reload the page. `preview_snapshot` the hero panel. Expect:
- All 81 cells filled instantly (no ink-bleed visible).
- 完 seal visible immediately with no entrance animation.
- Counter reads `81 placed` / `0 to go` on initial render.

Reset the emulation to "no preference" before continuing.

- [ ] **Step 8: Confirm signed-in path unaffected**

Sign in, navigate to `/`. The signed-in branch renders `HomeHeroSection` (not `Landing.tsx`). Verify the page loads normally with no animation regressions.

- [ ] **Step 9: Take a screenshot for the PR**

`preview_screenshot` of the hero panel mid-fill and another of the end state with seal. Save for the PR description.

- [ ] **Step 10: Final commit (only if anything changed during verification)**

If no fixes were needed during verification, skip this step. Otherwise:

```bash
git add -A
git commit -m "fix(landing): <describe fix from verification>"
```

---

## Self-review summary

- **Spec coverage:** every numbered section of the spec maps to a task — VermillionStamp extraction (T1), seal-stamp CSS (T2), data + sanity test (T3), static render + seal positioning (T4), animation timing (T5), IntersectionObserver + reduced-motion (T6), Landing integration (T7), verification (T8). The counter wiring lives inside T4 (initial render) and is driven by state set in T5.
- **No placeholders:** every step that changes code shows the exact code.
- **Type consistency:** `AnimatedHeroBoardProps`, `CellRole`, `GIVENS`, `START_PLACED`, `FILL_QUEUE`, `placedCount`, `sealVisible`, `containerRef`, `cycleStateRef`, `armReplayRef`, `play`, `clearTimers`, `TICK_MS`, `FILL_TOTAL_MS`, `SEAL_DELAY_MS`, `CYCLE_TOTAL_MS` — all introduced once with consistent names through the plan.
- **Numbers:** 32 givens + 13 start-placed + 36 fill = 81 cells. `placed` counter runs 45 → 81, `to go` runs 36 → 0. First cell at t=250ms, last cell at t=9000ms, seal at t=9500ms, cycle complete at t=9880ms.
