"use client";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/store/game-store";
import { formatTime } from "@/lib/utils";

export function Timer() {
  const [mounted, setMounted] = useState(false);
  const elapsed = useGame((s) => s.elapsed);
  const tick = useGame((s) => s.tick);
  const pause = useGame((s) => s.pause);
  const resume = useGame((s) => s.resumeTimer);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="font-mono text-lg" suppressHydrationWarning>
      {mounted ? formatTime(elapsed) : "0:00"}
    </div>
  );
}
