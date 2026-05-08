"use client";
import { useMemo } from "react";
import { useGame } from "@/lib/store/game-store";
import { cn } from "@/lib/utils";

/**
 * Vertical right-rail numpad in the Hako style.
 *  - 3×3 grid of digits with a small count badge per number
 *  - bottom action row: undo · notes · erase · pause
 *  - selected-value gets `.hot` (vermillion fill); fully-placed gets `.done`
 */
export function NumberPad({
  onPause,
  paused,
}: {
  onPause?: () => void;
  paused?: boolean;
}) {
  const selected = useGame((s) => s.selected);
  const noteMode = useGame((s) => s.noteMode);
  const board = useGame((s) => s.board);
  const givens = useGame((s) => s.givens);
  const selectedVal = selected != null ? board[selected] : 0;
  const setCell = useGame((s) => s.setCell);
  const toggleNote = useGame((s) => s.toggleNote);
  const toggleNoteMode = useGame((s) => s.toggleNoteMode);
  const undo = useGame((s) => s.undo);

  // Count remaining occurrences of each digit (count down from 9)
  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 };
    for (let i = 0; i < 81; i++) {
      const v = board[i];
      if (v) c[v] = Math.max(0, c[v] - 1);
    }
    // also count givens that we've never re-incremented
    return c;
  }, [board, givens]);

  const press = (v: number) => {
    if (selected == null) return;
    noteMode ? toggleNote(selected, v) : setCell(selected, v);
  };

  return (
    <div>
      <div className="eyebrow mb-2.5">numerals</div>
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const remaining = counts[n];
          const done = remaining === 0;
          const hot = !done && selectedVal === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => press(n)}
              className={cn("nk-d", done && "done", hot && "hot")}
              aria-label={`place ${n}`}
            >
              {n}
              <span className="ct">·{remaining}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-2">
        <button type="button" className="nk-d ak" onClick={undo}>
          ↶ undo
        </button>
        <button
          type="button"
          className={cn("nk-d ak", noteMode && "on")}
          onClick={toggleNoteMode}
          aria-pressed={noteMode}
        >
          ✎ notes
        </button>
        <button
          type="button"
          className="nk-d ak"
          onClick={() => selected != null && setCell(selected, 0)}
        >
          ⌫ erase
        </button>
        <button
          type="button"
          className={cn("nk-d ak", paused && "on")}
          onClick={onPause}
          aria-pressed={paused}
        >
          ‖ pause
        </button>
      </div>
    </div>
  );
}
