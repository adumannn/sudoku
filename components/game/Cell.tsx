"use client";
import { useEffect, useRef, useState, type AnimationEvent } from "react";
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

function prefersReducedMotion(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
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
  const previousValue = useRef(value);
  const [inkPlace, setInkPlace] = useState(false);

  useEffect(() => {
    const wasEmpty = previousValue.current === 0;
    const isPlacedDigit = value !== 0;

    if (!given && wasEmpty && isPlacedDigit && !prefersReducedMotion()) {
      setInkPlace(true);
    }

    if (!isPlacedDigit) {
      setInkPlace(false);
    }

    previousValue.current = value;
  }, [given, value]);

  const onAnimationEnd = (event: AnimationEvent<HTMLButtonElement>) => {
    if (event.currentTarget !== event.target) return;
    setInkPlace(false);
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      onAnimationEnd={onAnimationEnd}
      aria-label={`cell-${index} ${value || "empty"}`}
      className={cn(
        "hako-cell",
        given && "given",
        !given && value && "player",
        inkPlace && "ink-place",
        peer && !selected && "peer",
        sameVal && !selected && "same",
        selected && "selected",
        conflict && "conflict",
      )}
    >
      {value ? (
        <span className="cell-value">{value}</span>
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
