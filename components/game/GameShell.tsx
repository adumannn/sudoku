"use client";
import { useEffect } from "react";
import { useGame } from "@/lib/store/game-store";
import { Difficulty } from "@/lib/sudoku/types";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { NumberPad } from "./NumberPad";
import { Timer } from "./Timer";
import { WinModal } from "./WinModal";

interface Props {
  difficulty: Difficulty;
  puzzle: { id: string; givens: string; solution: string };
  dailyDate?: string;
}

export function GameShell({ difficulty, puzzle, dailyDate }: Props) {
  const load = useGame((s) => s.load);
  const setCell = useGame((s) => s.setCell);
  const toggleNote = useGame((s) => s.toggleNote);
  const toggleNoteMode = useGame((s) => s.toggleNoteMode);
  const undo = useGame((s) => s.undo);
  const redo = useGame((s) => s.redo);
  const select = useGame((s) => s.select);

  useEffect(() => {
    load({ difficulty, givens: puzzle.givens, solution: puzzle.solution, puzzleId: puzzle.id, dailyDate });
  }, [load, difficulty, puzzle.givens, puzzle.solution, puzzle.id, dailyDate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      if (e.key >= "1" && e.key <= "9") {
        if (s.selected == null) return;
        const v = +e.key;
        s.noteMode ? toggleNote(s.selected, v) : setCell(s.selected, v);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        if (s.selected != null) setCell(s.selected, 0);
        return;
      }
      if (e.key.toLowerCase() === "n") { toggleNoteMode(); return; }
      if (e.key.toLowerCase() === "u" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey)) { e.preventDefault(); undo(); return; }
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z")) { e.preventDefault(); redo(); return; }
      if (e.key.startsWith("Arrow")) {
        if (s.selected == null) { select(40); return; }
        const r = Math.floor(s.selected / 9), c = s.selected % 9;
        let nr = r, nc = c;
        if (e.key === "ArrowUp") nr = Math.max(0, r - 1);
        else if (e.key === "ArrowDown") nr = Math.min(8, r + 1);
        else if (e.key === "ArrowLeft") nc = Math.max(0, c - 1);
        else if (e.key === "ArrowRight") nc = Math.min(8, c + 1);
        select(nr * 9 + nc);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCell, toggleNote, toggleNoteMode, undo, redo, select]);

  return (
    <main className="container max-w-md py-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-2">
        <span className="text-sm capitalize text-muted-foreground">{difficulty}</span>
        <Timer />
      </div>
      <Board />
      <Controls />
      <NumberPad />
      <WinModal />
    </main>
  );
}
