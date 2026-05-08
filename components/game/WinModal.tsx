"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/store/game-store";
import { formatTime } from "@/lib/utils";

export function WinModal() {
  const isComplete = useGame((s) => s.isComplete);
  const elapsed = useGame((s) => s.elapsed);
  const errorsMade = useGame((s) => s.errorsMade);
  const hintsUsed = useGame((s) => s.hintsUsed);
  const difficulty = useGame((s) => s.difficulty);
  const dailyDate = useGame((s) => s.dailyDate);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isComplete) setOpen(true);
  }, [isComplete]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solved!</DialogTitle>
          <DialogDescription>
            {dailyDate ? `Daily Challenge — ${dailyDate}` : `${difficulty} puzzle complete.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-2 text-center">
          <Stat label="Time" value={formatTime(elapsed)} />
          <Stat label="Errors" value={errorsMade} />
          <Stat label="Hints" value={hintsUsed} />
        </div>
        <DialogFooter>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">Home</Button>
          </Link>
          {!dailyDate && difficulty && (
            <Link href={`/play/${difficulty}`} className="w-full">
              <Button className="w-full">Play another</Button>
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
