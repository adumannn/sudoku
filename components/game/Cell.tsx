"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

export function Cell({
  index,
  value,
  given,
  note,
  selected,
  peer,
  sameVal,
  conflict,
  onSelect,
}: CellProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`cell-${index} ${value || "empty"}`}
      className={cn(
        "hako-cell",
        given && "given",
        !given && value && "player",
        peer && !selected && "peer",
        sameVal && !selected && "same",
        selected && "selected",
        conflict && "conflict"
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
        <div className="grid grid-cols-3 gap-px text-[0.5rem] leading-none text-moss p-0.5 w-full h-full font-mono">
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
