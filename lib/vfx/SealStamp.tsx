"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SealStampProps {
  kanji: string;
  className?: string;
  ariaLive?: "polite" | "off";
}

export function SealStamp({
  kanji,
  className,
  ariaLive = "polite",
}: SealStampProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-label={`seal ${kanji}`}
      aria-live={ariaLive}
      className={cn(
        "seal-stamp-vfx",
        mounted && "seal-stamp-vfx-mounted",
        className,
      )}
    >
      <span aria-hidden>{kanji}</span>
    </div>
  );
}
