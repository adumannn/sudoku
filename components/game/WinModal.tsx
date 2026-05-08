"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const board = useGame((s) => s.board);

  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isComplete) setOpen(true);
  }, [isComplete]);

  const submit = async () => {
    if (!dailyDate) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/daily/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dailyDate,
        finalState: board.map((v) => v.toString()).join(""),
        elapsed,
        consentCity: consent,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Submission failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="relative overflow-hidden">
        <Confetti />
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
        {dailyDate && !submitted && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Share my city on the leaderboard
            </label>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </div>
        )}
        {dailyDate && submitted && (
          <div className="text-sm text-center text-muted-foreground">
            Submitted!{" "}
            <Link href="/leaderboard" className="underline">
              View leaderboard
            </Link>
          </div>
        )}
        <DialogFooter>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">Home</Button>
          </Link>
          {dailyDate && !submitted && (
            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit time"}
            </Button>
          )}
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

function Confetti() {
  const dots = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const colors = ["bg-primary", "bg-secondary-foreground", "bg-destructive", "bg-accent-foreground"];
        return (
          <motion.span
            key={i}
            className={`absolute left-1/2 top-1/2 h-2 w-2 rounded-full ${colors[i % colors.length]}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
