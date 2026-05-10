import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { computeUnifiedStreak } from "@/lib/seal/streak";
import { assembleYearSeries } from "@/lib/seal/year";
import { fillCalendarYear, type CalendarEntry } from "@/lib/seal/calendar";
import type { YearSeries } from "@/lib/seal/types";

export interface YearPageData {
  series: YearSeries;
  streak: number;
  stamped: number;
  total: number;
  percent: number;
}

/**
 * Per-user year-range queries shared by YearStats and YearScrollOnly.
 * Deduped within a single request via React's cache(), keyed by the argument
 * tuple. Callers MUST pass the same `today` string (and `year`) by value
 * across both call sites in a request — derive once at the page level and
 * thread through.
 */
export const fetchYearPageData = cache(async (
  userId: string,
  today: string,
  year: number,
): Promise<YearPageData> => {
  const sb = createServerClient();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [
    { data: cal },
    { data: results },
    { data: freezes },
    { data: profile },
    { data: dailyMeta },
  ] = await Promise.all([
    sb
      .from("daily_seal_calendar")
      .select("date,kanji,romaji,meaning")
      .gte("date", yearStart).lte("date", yearEnd)
      .order("date", { ascending: true }),
    sb.from("daily_results").select("date,elapsed_seconds")
      .eq("user_id", userId)
      .gte("date", yearStart).lte("date", yearEnd),
    sb.from("streak_freezes").select("date")
      .eq("user_id", userId)
      .gte("date", yearStart).lte("date", yearEnd),
    sb.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    sb
      .from("daily_puzzles")
      .select("date, skin_id, skins(seal_kanji)")
      .gte("date", yearStart).lte("date", yearEnd),
  ]);

  const completedByDate = new Map<string, number>();
  for (const r of (results ?? []) as { date: string; elapsed_seconds: number }[]) {
    completedByDate.set(r.date, r.elapsed_seconds);
  }
  const frozenDates = new Set<string>(((freezes ?? []) as { date: string }[]).map((f) => f.date));
  type DailyMetaRow = { date: string; skin_id: string; skins: { seal_kanji: string } | null };
  const sealKanjiByDate = new Map<string, string>();
  for (const r of (dailyMeta ?? []) as unknown as DailyMetaRow[]) {
    sealKanjiByDate.set(r.date, r.skins?.seal_kanji ?? "完");
  }
  const signupDate = profile?.created_at
    ? new Date(profile.created_at).toISOString().slice(0, 10)
    : yearStart;

  const series: YearSeries = assembleYearSeries({
    today,
    calendar: fillCalendarYear(year, (cal ?? []) as CalendarEntry[]),
    completedByDate,
    frozenDates,
    signupDate,
    sealKanjiByDate,
  });
  const streak = computeUnifiedStreak(today, new Set(completedByDate.keys()), frozenDates);
  const filled = series.seals.filter((s) => s.state === "filled").length;
  const frozen = series.seals.filter((s) => s.state === "freeze").length;
  const total = series.seals.length;
  const stamped = filled + frozen;
  const percent = total > 0 ? Math.round((stamped / total) * 100) : 0;

  return { series, streak, stamped, total, percent };
});
