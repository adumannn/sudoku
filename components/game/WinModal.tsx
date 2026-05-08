"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
    if (!isComplete) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
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
      <DialogContent className="relative overflow-hidden p-0 max-w-[480px] bg-bone border-2 border-sumi rounded-none">
        <div className="px-8 py-10 text-center relative">
          <div className="relative w-[88px] h-[88px] mx-auto">
            <SealWash />
            <SealBurst />
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 7 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="seal-stamp w-[88px] h-[88px] text-[48px] absolute inset-0"
            >
              完
            </motion.div>
          </div>
          <DialogTitle asChild>
            <h2 className="h-disp text-[56px] mt-6 leading-[0.96]">
              Solved.
            </h2>
          </DialogTitle>
          <p className="ital text-moss text-[18px] mt-3">
            {dailyDate
              ? `Daily № 0472 · ${dailyDate}`
              : `${difficulty ?? "casual"} box closed.`}
          </p>

          <div className="grid grid-cols-3 gap-2 py-6 mt-4 border-t border-b border-sumi">
            <Stat label="time" value={formatTime(elapsed)} />
            <Stat label="errors" value={errorsMade} />
            <Stat label="hints" value={hintsUsed} />
          </div>

          {dailyDate && !submitted && (
            <div className="space-y-3 mt-4 text-left">
              <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="h-4 w-4 accent-vermillion"
                />
                <span>Share my city on the ledger</span>
              </label>
              {error && (
                <div className="text-hazard text-[13px] mono uppercase tracking-wider">
                  {error}
                </div>
              )}
            </div>
          )}

          {dailyDate && submitted && (
            <div className="text-[14px] text-center text-moss mt-4 ital">
              submitted ·{" "}
              <Link href="/leaderboard" className="underline text-vermillion">
                view ledger
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-6">
            <Link
              href="/"
              className="btn-hako ghost justify-center font-mincho text-[14px] py-3"
            >
              home
            </Link>
            {dailyDate && !submitted && (
              <button
                className="btn-hako red justify-center font-mincho text-[14px] py-3"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? "submitting…" : "submit time"}
              </button>
            )}
            {!dailyDate && difficulty && (
              <Link
                href={`/play/${difficulty}`}
                className="btn-hako red justify-center font-mincho text-[14px] py-3"
              >
                play another
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="kdate-jp text-[28px] font-semibold mt-1 tnum">
        {value}
      </div>
    </div>
  );
}

/** Subtle vermillion ink burst centered on the seal */
function SealBurst() {
  const rays = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0">
      {rays.map((i) => {
        const angle = (i / rays.length) * Math.PI * 2;
        const distance = 60 + Math.random() * 30;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 bg-vermillion rounded-full"
            initial={{ x: 0, y: 0, opacity: 0.7, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        );
      })}
    </div>
  );
}

/** Vermillion radial wash behind the seal */
function SealWash() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1.6 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(closest-side, hsla(9 66% 46% / 0.18), transparent)",
      }}
    />
  );
}
