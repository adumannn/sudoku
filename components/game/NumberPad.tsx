"use client";
import { Eraser, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/store/game-store";

export function NumberPad() {
  const selected = useGame((s) => s.selected);
  const noteMode = useGame((s) => s.noteMode);
  const setCell = useGame((s) => s.setCell);
  const toggleNote = useGame((s) => s.toggleNote);
  const toggleNoteMode = useGame((s) => s.toggleNoteMode);

  const press = (v: number) => {
    if (selected == null) return;
    if (v === 0) {
      setCell(selected, 0);
      return;
    }
    noteMode ? toggleNote(selected, v) : setCell(selected, v);
  };

  return (
    <div className="grid grid-cols-5 gap-2 w-full max-w-md mt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <Button key={n} variant="secondary" className="h-12 text-lg font-semibold" onClick={() => press(n)}>
          {n}
        </Button>
      ))}
      <Button variant="outline" className="h-12" onClick={() => press(0)} aria-label="Erase">
        <Eraser className="h-5 w-5" />
      </Button>
      <Button variant={noteMode ? "default" : "outline"} className="h-12 col-span-5" onClick={toggleNoteMode}>
        <Pencil className="h-4 w-4 mr-2" /> Notes {noteMode ? "ON" : "OFF"}
      </Button>
    </div>
  );
}
