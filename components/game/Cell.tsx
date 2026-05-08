"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { rc } from "@/lib/sudoku/types";

export interface CellProps {
  index: number;
  value: number;
  given: boolean;
  note?: number[];
  selected: boolean;
  peer: boolean;
  sameVal: boolean;
  conflict: boolean;
  onSelect: () => void;
}

export function Cell({ index, value, given, note, selected, peer, sameVal, conflict, onSelect }: CellProps) {
  const [r, c] = rc(index);
  const borderRight = c === 2 || c === 5 ? "border-r-2 border-r-foreground" : "border-r border-r-border";
  const borderBottom = r === 2 || r === 5 ? "border-b-2 border-b-foreground" : "border-b border-b-border";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`R${r + 1}C${c + 1} ${value || "empty"}`}
      className={cn(
        "relative flex items-center justify-center text-xl font-medium aspect-square min-w-[44px] min-h-[44px]",
        borderRight,
        borderBottom,
        selected && "bg-primary/10 ring-2 ring-primary z-10",
        !selected && peer && "bg-muted",
        !selected && sameVal && "bg-primary/15",
        conflict && "text-destructive bg-destructive/10",
        given && "font-bold"
      )}
    >
      {value ? (
        <motion.span
          key={`${index}-${value}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.12 }}
        >
          {value}
        </motion.span>
      ) : note?.length ? (
        <div className="grid grid-cols-3 gap-px text-[0.55rem] leading-none text-muted-foreground p-0.5 w-full h-full">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <span key={n} className="flex items-center justify-center">
              {note.includes(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
