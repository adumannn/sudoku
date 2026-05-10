import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/utils";
import { computeUnifiedStreak } from "@/lib/seal/streak";
import { computeUserHeatmap } from "@/lib/stats/heatmap";
import { computeStatuses, ACHIEVEMENTS, type GameRow } from "@/lib/achievements";

export interface ProfileData {
  today: string;
  daysOnHako: number;
  streak: number;
  streakStart: string | null;
  dailiesKept: number;
  missed: number;
  lastOpenedTime: string | null;
  diffStats: Record<string, { best: number; count: number; bestGame: GameRow | undefined }>;
  heatmap: ReturnType<typeof computeUserHeatmap>;
  statuses: ReturnType<typeof computeStatuses>;
  earnedCount: number;
  rareCount: number;
  lastEarned: { glyph: string; when: string } | null;
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function formatSince(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
}

function streakStartDate(
  today: string,
  completed: Set<string>,
  frozen: Set<string>,
): string | null {
  const present = (d: string) => completed.has(d) || frozen.has(d);
  let cursor = today;
  if (!present(cursor)) {
    const d = new Date(cursor + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  if (!present(cursor)) return null;
  let last = cursor;
  while (present(cursor)) {
    last = cursor;
    const d = new Date(cursor + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return last;
}

export const fetchProfileData = cache(async (userId: string, userCreatedAt: string | null): Promise<ProfileData> => {
  const sb = createServerClient();
  const today = todayUTC();
  const windowStart = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 181);
    return d.toISOString().slice(0, 10);
  })();
  const recentWindowStart = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 730);
    return d.toISOString().slice(0, 10);
  })();

  const [
    { data: games },
    { data: dailyResults },
    { data: streakFreezes },
    { data: heatmapResults },
    { data: heatmapMedians },
  ] = await Promise.all([
    sb
      .from("games")
      .select("difficulty,is_complete,elapsed_seconds,errors_made,hints_used,daily_date,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    sb.from("daily_results").select("date").eq("user_id", userId).gte("date", recentWindowStart).lte("date", today),
    sb.from("streak_freezes").select("date").eq("user_id", userId).gte("date", recentWindowStart).lte("date", today),
    sb.from("daily_results").select("date,elapsed_seconds").eq("user_id", userId).gte("date", windowStart).lte("date", today),
    sb.from("daily_results").select("date,elapsed_seconds").gte("date", windowStart).lte("date", today),
  ]);

  const all = (games ?? []) as GameRow[];
  const completed = all.filter((g) => g.is_complete);
  const byDiff = (d: string) => completed.filter((g) => g.difficulty === d);
  const best = (xs: number[]) => (xs.length ? Math.min(...xs) : 0);

  const completedDates = new Set<string>(((dailyResults ?? []) as { date: string }[]).map((r) => r.date));
  const frozenDates = new Set<string>(((streakFreezes ?? []) as { date: string }[]).map((f) => f.date));
  const streak = computeUnifiedStreak(today, completedDates, frozenDates);

  const grouped = new Map<string, number[]>();
  for (const row of (heatmapMedians as { date: string; elapsed_seconds: number }[] | null) ?? []) {
    const arr = grouped.get(row.date) ?? [];
    arr.push(row.elapsed_seconds);
    grouped.set(row.date, arr);
  }
  const mediansByDate = new Map<string, number>();
  for (const [d, arr] of grouped) {
    arr.sort((a, b) => a - b);
    const mid = arr.length / 2;
    mediansByDate.set(
      d,
      Number.isInteger(mid)
        ? Math.round((arr[mid - 1] + arr[mid]) / 2)
        : arr[Math.floor(mid)],
    );
  }
  const heatmap = computeUserHeatmap({
    today,
    results: ((heatmapResults ?? []) as { date: string; elapsed_seconds: number }[]),
    freezes: frozenDates,
    mediansByDate,
  });

  const daysOnHako = userCreatedAt
    ? Math.max(
        0,
        Math.floor(
          (new Date(today + "T00:00:00Z").getTime() - new Date(userCreatedAt).getTime()) /
            86_400_000,
        ),
      )
    : 0;

  const streakStart = streakStartDate(today, completedDates, frozenDates);
  const dailiesKept = completedDates.size;
  const missed = Math.max(0, daysOnHako - dailiesKept - frozenDates.size);

  const newest = (games ?? [])[0];
  let lastOpenedTime: string | null = null;
  if (newest) {
    const d = new Date(newest.created_at);
    const iso = d.toISOString().slice(0, 10);
    if (iso === today) {
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      lastOpenedTime = `${hh}:${mm}`;
    }
  }

  const diffsKeys = ["easy", "medium", "hard", "expert"];
  const diffStats: ProfileData["diffStats"] = {};
  for (const key of diffsKeys) {
    const xs = byDiff(key).map((g) => g.elapsed_seconds);
    const bestSec = best(xs);
    diffStats[key] = {
      best: bestSec,
      count: xs.length,
      bestGame: bestSec > 0 ? byDiff(key).find((g) => g.elapsed_seconds === bestSec) : undefined,
    };
  }

  const statuses = computeStatuses(all, { today, frozen: frozenDates });
  const earnedCount = statuses.filter((s) => s.earned).length;
  const rareCount = statuses.filter((s) => {
    const a = ACHIEVEMENTS.find((x) => x.key === s.key);
    return s.earned && a?.category === "special";
  }).length;
  const lastEarned = statuses
    .filter((s) => s.earned && s.earnedAt)
    .map((s) => {
      const a = ACHIEVEMENTS.find((x) => x.key === s.key)!;
      return { glyph: a.glyph, when: s.earnedAt! };
    })[0] ?? null;

  return {
    today,
    daysOnHako,
    streak,
    streakStart,
    dailiesKept,
    missed,
    lastOpenedTime,
    diffStats,
    heatmap,
    statuses,
    earnedCount,
    rareCount,
    lastEarned,
  };
});

export { formatSince };
