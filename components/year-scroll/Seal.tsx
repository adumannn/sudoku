"use client";
import { cn } from "@/lib/utils";
import type { SealState } from "@/lib/seal/types";

export interface SealProps {
  kanji?: string;
  state: SealState;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  ariaLabel?: string;
}

const SIZES = {
  sm: { box: "text-[14px]", corner: "w-[8px] h-[8px] text-[5px] -bottom-[1px] -right-[1px]" },
  md: { box: "text-[36px]", corner: "w-[16px] h-[16px] text-[9px] bottom-[3px] right-[3px]" },
  lg: { box: "text-[96px]", corner: "w-[24px] h-[24px] text-[14px] bottom-[8px] right-[8px]" },
};

export function Seal({ kanji, state, size = "sm", onClick, ariaLabel }: SealProps) {
  const sz = SIZES[size];
  const interactive = !!onClick;

  const base =
    "relative aspect-square flex items-center justify-center leading-none mincho select-none";
  const stateClass = {
    filled: "bg-sumi/[0.03] border border-sumi/[0.32] text-sumi",
    today:
      "bg-vermillion/[0.04] border-[1.5px] border-vermillion/70 text-vermillion/45 motion-safe:animate-[seal-pulse_1.8s_ease-in-out_infinite]",
    empty: "border border-dashed border-sumi/[0.16]",
    future: "border border-sumi/[0.07]",
    freeze: "bg-sumi/[0.03] border border-dashed border-vermillion/40 text-sumi",
    "pre-signup": "border border-sumi/[0.04]",
  }[state];

  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(base, sz.box, stateClass, interactive && "cursor-pointer hover:bg-sumi/[0.06]")}
    >
      {(state === "filled" || state === "freeze") && kanji}
      {state === "filled" && (
        <span
          className={cn(
            "absolute bg-vermillion text-bone rounded-full flex items-center justify-center font-semibold",
            sz.corner,
          )}
          style={{ transform: "rotate(-6deg)" }}
        >
          ✓
        </span>
      )}
      {state === "freeze" && (
        <span
          className={cn(
            "absolute bg-bone text-vermillion rounded-full flex items-center justify-center mincho border border-vermillion/60",
            sz.corner,
          )}
        >
          凍
        </span>
      )}
    </Tag>
  );
}
