import type { CSSProperties } from "react";

interface SkeletonBoxProps {
  className?: string;
  style?: CSSProperties;
  /** Outlined variant uses a border instead of a fill (e.g. for grid cells). */
  outlined?: boolean;
}

/**
 * Static placeholder block. No animation — matches the paper-and-ink aesthetic.
 * Compose with explicit width/height utility classes so swap-in produces no layout shift.
 */
export function SkeletonBox({ className = "", style, outlined = false }: SkeletonBoxProps) {
  const base = outlined
    ? "border border-sumi/10"
    : "bg-sumi/[0.04] border border-sumi/10";
  return <div aria-hidden="true" className={`${base} ${className}`} style={style} />;
}
