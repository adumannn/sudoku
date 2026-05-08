"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { syncGuestGame } from "@/app/actions/sync-guest";
import { safeLocal } from "@/lib/store/persist";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sb = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const fn = mode === "signin" ? sb.auth.signInWithPassword.bind(sb.auth) : sb.auth.signUp.bind(sb.auth);
    const { error } = await fn({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
    } else {
      if (mode === "signup") {
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
      window.location.href = "/";
    }
  };

  const google = async () => {
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 max-w-sm">
      <input
        className="border rounded p-2 bg-background"
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="border rounded p-2 bg-background"
        type="password"
        placeholder="password (min 6)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      {err && <div className="text-destructive text-sm">{err}</div>}
      <Button type="submit" disabled={loading}>
        {mode === "signin" ? "Sign in" : "Create account"}
      </Button>
      <Button type="button" variant="outline" onClick={google}>
        Continue with Google
      </Button>
    </form>
  );
}
