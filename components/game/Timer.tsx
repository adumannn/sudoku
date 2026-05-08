"use client";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/store/game-store";
import { cn } from "@/lib/utils";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

export function Timer({
  className,
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "display";
}) {
  const [mounted, setMounted] = useState(false);
  const elapsed = useGame((s) => s.elapsed);
  const tick = useGame((s) => s.tick);
  const pause = useGame((s) => s.pause);
  const resume = useGame((s) => s.resumeTimer);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(tick, 1000);
    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mounted, tick, pause, resume]);

  return (
    <div
      suppressHydrationWarning
      className={cn(
        variant === "display"
          ? "kdate-jp text-[88px] font-semibold leading-[1] tracking-[-0.02em] text-sumi tnum"
          : "kdate-jp font-mono text-2xl font-medium tracking-[0.04em] text-sumi tnum",
        className
      )}
    >
      {mounted ? fmt(elapsed) : "00:00"}
    </div>
  );
}
