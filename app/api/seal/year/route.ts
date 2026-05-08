// app/api/seal/year/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { assembleYearSeries } from "@/lib/seal/year";
import { todayUTC } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createServerClient();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const userId = session.user.id;

  const today = todayUTC();
  const year = parseInt(today.slice(0, 4), 10);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [{ data: calendar }, { data: results }, { data: freezes }, { data: profile }] =
    await Promise.all([
      sb
        .from("daily_seal_calendar")
        .select("date,kanji,romaji,meaning")
        .gte("date", yearStart)
        .lte("date", yearEnd)
        .order("date", { ascending: true }),
      sb
        .from("daily_results")
        .select("date,elapsed_seconds")
        .eq("user_id", userId)
        .gte("date", yearStart)
        .lte("date", yearEnd),
      sb
        .from("streak_freezes")
        .select("date")
        .eq("user_id", userId)
        .gte("date", yearStart)
        .lte("date", yearEnd),
      sb.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    ]);

  const completedByDate = new Map<string, number>();
  for (const r of (results ?? []) as { date: string; elapsed_seconds: number }[]) {
    completedByDate.set(r.date, r.elapsed_seconds);
  }
  const frozenDates = new Set<string>(
    ((freezes ?? []) as { date: string }[]).map((f) => f.date),
  );
  const signupDate = profile?.created_at
    ? new Date(profile.created_at).toISOString().slice(0, 10)
    : yearStart;

  const series = assembleYearSeries({
    today,
    calendar: (calendar ?? []) as any[],
    completedByDate,
    frozenDates,
    signupDate,
  });

  return NextResponse.json(series);
}
