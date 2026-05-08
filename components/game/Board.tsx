"use client";
import { useMemo } from "react";
import { useGame } from "@/lib/store/game-store";
import { findConflicts } from "@/lib/sudoku/validate";
import { rc, boxOf } from "@/lib/sudoku/types";
import { Cell } from "./Cell";

export function Board() {
  const board = useGame((s) => s.board);
  const givens = useGame((s) => s.givens);
  const notes = useGame((s) => s.notes);
  const selected = useGame((s) => s.selected);
  const errorsOn = useGame((s) => s.errorsHighlighted);
  const select = useGame((s) => s.select);
  const conflicts = useMemo(
    () => (errorsOn ? new Set(findConflicts(board)) : new Set<number>()),
    [board, errorsOn]
  );
  const sel = selected != null ? rc(selected) : null;
  const selBox = selected != null ? boxOf(...rc(selected)) : -1;
  const selectedValue = selected != null ? board[selected] : 0;

  return (
    <div role="grid" className="hako-board">
      {board.map((v, i) => {
        const [r, c] = rc(i);
        const peer = sel
          ? sel[0] === r || sel[1] === c || boxOf(r, c) === selBox
          : false;
        const sameVal =
          !!selectedValue && v === selectedValue && i !== selected;
        return (
          <Cell
            key={i}
            index={i}
            value={v}
            given={givens[i] !== 0}
            note={notes[i]}
            selected={selected === i}
            peer={peer}
            sameVal={sameVal}
            conflict={conflicts.has(i)}
            onSelect={() => select(i)}
          />
        );
      })}
    </div>
  );
}
