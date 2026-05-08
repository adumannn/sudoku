"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncGuestGame } from "@/app/actions/sync-guest";
import { safeLocal } from "@/lib/store/persist";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sb = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    // OTP magic-link style (passwordless)
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
    // The app sends a magic link — show a confirmation
    alert("Check your email for the magic link.");
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
