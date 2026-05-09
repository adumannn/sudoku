import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { formatTime, todayUTC } from "@/lib/utils";
import { kanjiNum } from "@/lib/kanji";
import { Masthead } from "@/components/Masthead";
import { Heatmap } from "@/components/stats/Heatmap";
import { AchievementsLedger } from "@/components/profile/AchievementsLedger";
import { AchievementStamp } from "@/components/profile/AchievementStamp";
import { CityPicker } from "@/components/profile/CityPicker";
import { computeStatuses, type GameRow } from "@/lib/achievements";
import { computeUnifiedStreak } from "@/lib/seal/streak";
import { computeUserHeatmap } from "@/lib/stats/heatmap";
import { computeCityCounts } from "@/lib/stats/leaderboard";
import { getCity } from "@/lib/geo";

export const dynamic = "force-dynamic";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function formatSince(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export default async function Profile() {
  const sb = createServerClient();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) redirect("/auth/login");
  const user = session.user;

  const initial = user.email?.[0] ?? "·";
  const username = user.email?.split("@")[0] ?? "duman";

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
    { data: profile },
    { data: games },
    { data: dailyResults },
    { data: streakFreezes },
    { data: heatmapResults },
    { data: heatmapMedians },
    { data: latestDaily },
    { data: cityRows },
  ] = await Promise.all([
    sb.from("profiles").select("created_at,city").eq("id", user.id).maybeSingle(),
    sb
      .from("games")
      .select(
        "difficulty,is_complete,elapsed_seconds,errors_made,hints_used,daily_date,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    sb
      .from("daily_results")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", recentWindowStart)
      .lte("date", today),
    sb
      .from("streak_freezes")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", recentWindowStart)
      .lte("date", today),
    sb
      .from("daily_results")
      .select("date,elapsed_seconds")
      .eq("user_id", user.id)
      .gte("date", windowStart)
      .lte("date", today),
    sb
      .from("daily_results")
      .select("date,elapsed_seconds")
      .gte("date", windowStart)
      .lte("date", today),
    sb
      .from("daily_results")
      .select("date,elapsed_seconds,daily_puzzles(seq,difficulty)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from("daily_results").select("city").eq("date", today),
  ]);

  // Rename for clarity — this is everyone's results across the heatmap window,
  // used to compute per-day medians.
  const globalDaily = heatmapMedians as { date: string; elapsed_seconds: number }[] | null;

  const all = (games ?? []) as GameRow[];
  const completed = all.filter((g) => g.is_complete);
  const byDiff = (d: string) => completed.filter((g) => g.difficulty === d);
  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const best = (xs: number[]) => (xs.length ? Math.min(...xs) : 0);

  const completedDates = new Set<string>(
    ((dailyResults ?? []) as { date: string }[]).map((r) => r.date),
  );
  const frozenDates = new Set<string>(
    ((streakFreezes ?? []) as { date: string }[]).map((f) => f.date),
  );
  const streak = computeUnifiedStreak(today, completedDates, frozenDates);

  // Heatmap data — compute medians per date in TS from the global slice.
  const grouped = new Map<string, number[]>();
  for (const row of globalDaily ?? []) {
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

  const totals = {
    streak,
    solvedAll: completed.length,
    daily: completed.filter((g) => g.difficulty !== "casual").length,
    expert: byDiff("expert").length,
    avgSecs: avg(completed.map((g) => g.elapsed_seconds)),
  };

  const since = profile?.created_at ? formatSince(profile.created_at) : "—";

  const diffs: { key: string; label: string; accent?: boolean }[] = [
    { key: "easy", label: "易 Easy" },
    { key: "medium", label: "中 Medium" },
    { key: "hard", label: "難 Hard" },
    { key: "expert", label: "極 Expert", accent: true },
  ];

  const diffStats = (d: string) => {
    const xs = byDiff(d).map((g) => g.elapsed_seconds);
    return { best: best(xs), avg: avg(xs), count: xs.length };
  };

  const statuses = computeStatuses(all);
  const earnedCount = statuses.filter((s) => s.earned).length;

  const recentDaily = latestDaily as
    | { date: string; elapsed_seconds: number; daily_puzzles: { seq: number; difficulty: string } | null }
    | null;
  const recentLabel = recentDaily?.daily_puzzles
    ? `${recentDaily.daily_puzzles.seq.toString().padStart(4, "0")} · ${recentDaily.date} · ${recentDaily.daily_puzzles.difficulty}`
    : null;

  // Popular cities for the picker.
  const popular = computeCityCounts({
    rows: ((cityRows ?? []) as { city: string | null }[]),
    userCity: null,
  });

  return (
    <>
      <Masthead active="profile" initial={initial} />

      <main className="px-7 lg:px-14 py-12 lg:py-16 max-w-[1480px] mx-auto">
        <div className="eyebrow">
          {username} · since {since}
        </div>
        <h1 className="h-disp text-[clamp(36px,7vw,54px)] mt-2">
          A solver&rsquo;s ledger.
        </h1>

        <div className="mt-6">
          <CityPicker
            current={profile?.city ?? null}
            suggestion={getCity()}
            popular={popular}
          />
        </div>

        {/* Top stats row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 border-t-2 border-b-2 border-sumi py-6">
          <div className="md:border-r border-sumi/20 md:pr-6">
            <div className="eyebrow">streak · today</div>
            <div className="kdate-jp text-[60px] md:text-[72px] text-vermillion font-semibold leading-none mt-2">
              {kanjiNum(totals.streak)}
            </div>
            <div className="txt-small mt-2">{totals.streak} days</div>
          </div>
          <div className="md:border-r border-sumi/20 md:px-6 mt-6 md:mt-0">
            <div className="eyebrow">solved · all</div>
            <div className="kdate-jp text-[60px] md:text-[72px] font-bold leading-none mt-2 tnum">
              {totals.solvedAll}
            </div>
            <div className="txt-small mt-2">
              {totals.daily} daily · {totals.expert} expert
            </div>
          </div>
          <div className="md:pl-6 mt-6 md:mt-0">
            <div className="eyebrow">average pace</div>
            <div className="kdate-jp text-[60px] md:text-[72px] font-semibold leading-none mt-2 tnum">
              {formatTime(Math.round(totals.avgSecs))}
            </div>
            <div className="txt-small mt-2">
              {totals.solvedAll === 0 ? "no solves yet" : "across all completed games"}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2 mb-3.5">
            <div>
              <div className="eyebrow">last 26 weeks · 完 stamps</div>
              <h3 className="h-disp text-[24px] mt-1.5">
                Half a year, mostly kept.
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto -mx-7 px-7 lg:mx-0 lg:px-0">
            <Heatmap days={heatmap} />
          </div>
          <div className="mt-3.5 flex justify-end items-center mono text-[10px] tracking-[0.18em] uppercase text-moss">
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px]">less</span>
              <span className="w-3 h-3 border-[0.5px] border-sumi/20" />
              <span className="w-3 h-3 bg-vermillion/20" />
              <span className="w-3 h-3 bg-vermillion/55" />
              <span className="w-3 h-3 bg-vermillion" />
              <span className="text-[10px]">more</span>
            </div>
          </div>
        </div>

        {/* Best times grid */}
        <div className="mt-12">
          <div className="eyebrow mb-3.5">best times by box</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {diffs.map((d) => {
              const stat = diffStats(d.key);
              return (
                <div
                  key={d.key}
                  className={
                    "border-[1.5px] border-sumi p-6 " +
                    (d.accent ? "bg-vermillion text-bone" : "")
                  }
                >
                  <div className="kdate-jp text-2xl">{d.label}</div>
                  <div
                    className={
                      "mincho font-semibold mt-2 leading-none text-[36px] lg:text-[42px] tnum"
                    }
                  >
                    {stat.count > 0 ? formatTime(stat.best) : "—"}
                  </div>
                  <div
                    className={
                      "text-[12.5px] mt-1.5 " +
                      (d.accent ? "text-bone/70 font-jakarta" : "txt-small")
                    }
                  >
                    {stat.count > 0
                      ? `avg ${formatTime(Math.round(stat.avg))} · ${stat.count} solved`
                      : "no solves yet"}
                    {d.accent && stat.count > 0 ? " · pro" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <section className="mt-24">
          <div className="grid grid-cols-[auto_1fr_auto] gap-8 items-end border-b-[1.5px] border-sumi pb-[18px]">
            <div>
              <div className="mono text-[11px] tracking-[0.22em] uppercase text-moss">
                § achievements
              </div>
              <h2 className="mincho font-medium text-[36px] leading-none -tracking-[0.01em] mt-2">
                Achievements
                <span className="text-vermillion ml-3.5 text-[0.7em] align-baseline">
                  章
                </span>
              </h2>
            </div>
            <div className="ital text-moss text-[17px] leading-snug max-w-[54ch] justify-self-start self-end">
              — twelve marks a serious solver might collect. Earned and locked
              sit next to each other; two specials stay hidden until you find
              them.
            </div>
            <div className="mono text-[10.5px] tracking-[0.18em] uppercase text-moss">
              {earnedCount} of 12 · earned
            </div>
          </div>

          {recentLabel ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center py-6 border-t border-sumi/14 border-b border-sumi/14">
              <div>
                <div className="ital text-[15px] text-moss mb-1">
                  Daily № {recentLabel}
                </div>
                <div className="mincho text-[18px] font-medium text-sumi leading-snug">
                  Solved in{" "}
                  <span className="text-vermillion font-semibold">
                    {formatTime(recentDaily!.elapsed_seconds)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3.5">
                <AchievementStamp glyph="完" size="small" title="completion" />
              </div>
            </div>
          ) : (
            <p className="ital text-moss text-[15px] mt-8">
              — finish a daily to begin your ledger.
            </p>
          )}

          <div className="mt-9">
            <AchievementsLedger statuses={statuses} />
          </div>
        </section>
      </main>
    </>
  );
}
