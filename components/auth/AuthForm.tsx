"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncGuestGame } from "@/app/actions/sync-guest";
import { safeLocal } from "@/lib/store/persist";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const sb = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setErr(null);
    setSent(true);
  };

  const google = async () => {
    if (mode === "signup") {
      // Save guest progress so it gets synced after callback
      const saved = safeLocal.get<{
        givens?: number[];
        board?: number[];
        notes?: Record<string, number[]>;
        difficulty?: string;
        puzzleId?: string | null;
        dailyDate?: string | null;
        elapsed?: number;
        errorsMade?: number;
        hintsUsed?: number;
        isComplete?: boolean;
      }>("sudoku/game-v1");
      if (saved?.givens && saved.board && saved.difficulty) {
        await syncGuestGame({
          givens: saved.givens.map((v) => v.toString()).join(""),
          current: saved.board.map((v) => v.toString()).join(""),
          notes: saved.notes ?? {},
          difficulty: saved.difficulty,
          puzzleId: saved.puzzleId ?? undefined,
          dailyDate: saved.dailyDate ?? undefined,
          elapsed: saved.elapsed ?? 0,
          errors: saved.errorsMade ?? 0,
          hints: saved.hintsUsed ?? 0,
          complete: saved.isComplete ?? false,
        }).catch(() => {});
      }
    }
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const heading = mode === "signin" ? "Continue." : "Begin one.";
  const eyebrow = mode === "signin" ? "log in" : "sign up";

  if (sent) {
    return (
      <div>
        <div className="eyebrow red">check your email</div>
        <h3 className="h-disp text-[36px] mt-2">Magic link sent.</h3>
        <div className="mt-9 border-[1.5px] border-sumi p-5 bg-paper flex gap-4 items-start">
          <div className="seal-stamp w-9 h-9 text-[18px] shrink-0">完</div>
          <div>
            <div className="mincho font-semibold text-[15px] text-sumi">
              {email}
            </div>
            <p className="ital text-moss text-[14px] mt-1.5 leading-snug">
              The link works once and expires in 10 minutes. Check spam if it
              hasn&rsquo;t arrived in a minute.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-5 mono text-[10px] tracking-[0.22em] uppercase text-moss hover:text-vermillion"
        >
          ← use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="eyebrow red">{eyebrow}</div>
      <h3 className="h-disp text-[36px] mt-2">{heading}</h3>

      <button
        type="button"
        onClick={google}
        className="mt-9 w-full p-4 border-[1.5px] border-sumi bg-bone mincho font-medium text-[16px] text-sumi text-left flex justify-between items-center hover:bg-rice transition-colors"
      >
        <span>Continue with Google</span>
        <span className="text-[14px] text-moss mono">G</span>
      </button>
      <div className="text-center mono text-[9.5px] tracking-[0.22em] uppercase text-moss my-5">
        — or by email —
      </div>
      <form onSubmit={submit}>
        <input
          className="w-full p-4 border-[1.5px] border-sumi bg-transparent font-jakarta text-[16px] text-sumi outline-none focus:bg-paper transition-colors"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {err && (
          <div className="text-hazard text-[13px] mt-2 mono uppercase tracking-wider">
            {err}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-hako mt-2 w-full justify-between disabled:opacity-50"
        >
          {loading ? "…" : "Continue"}
          <span className="font-jakarta font-light text-lg">→</span>
        </button>
      </form>
    </div>
  );
}
