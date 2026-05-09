// app/page.tsx
import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { TodayCard } from "@/components/year-scroll/TodayCard";
import { YearScroll } from "@/components/year-scroll/YearScroll";
import { createServerClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/utils";
import { computeUnifiedStreak } from "@/lib/seal/streak";
import { computeAllotment } from "@/lib/seal/freeze";
import { assembleYearSeries } from "@/lib/seal/year";
import { dateLine, weekdayJp } from "@/lib/kanji";
import type { YearSeries } from "@/lib/seal/types";

export const dynamic = "force-dynamic";

interface LedgerRow {
  user_id: string;
  elapsed_seconds: number;
  profiles: { username: string | null } | null;
}

const NAMES_FALLBACK = [
  { rank: "01", name: "nurali", time: "02:48", first: true },
  { rank: "02", name: "aigerim", time: "02:54", first: false },
  { rank: "03", name: "dauren", time: "03:01", first: false },
];

function formatHMS(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default async function Home() {
  const sb = createServerClient();
  const {
    data: { session },
  } = await sb.auth.getSession();
  const user = session?.user;
  const initial = user?.email?.[0] ?? "·";
  const today = todayUTC();
  const year = parseInt(today.slice(0, 4), 10);

  // Today seal
  const { data: todayCal } = await sb
    .from("daily_seal_calendar")
    .select("date,kanji,romaji,meaning")
    .eq("date", today)
    .maybeSingle();
  const { data: todayLine } = await sb
    .from("daily_seal_lines")
    .select("line")
    .eq("date", today)
    .maybeSingle();
  const todaySeal = todayCal
    ? {
        date: todayCal.date,
        kanji: todayCal.kanji,
        romaji: todayCal.romaji,
        meaning: todayCal.meaning,
        senseiLine: todayLine?.line ?? null,
      }
    : null;

  // Year series + streak (signed-in only)
  let series: YearSeries | null = null;
  let streak = 0;
  let completedTodayElapsed: number | undefined;
  let freezePrompt: { date: string; kanji: string; remaining: number } | null = null;
  if (user) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const [{ data: cal }, { data: results }, { data: freezes }, { data: profile }] =
      await Promise.all([
        sb
          .from("daily_seal_calendar")
          .select("date,kanji,romaji,meaning")
          .gte("date", yearStart).lte("date", yearEnd)
          .order("date", { ascending: true }),
        sb.from("daily_results").select("date,elapsed_seconds")
          .eq("user_id", user.id)
          .gte("date", yearStart).lte("date", yearEnd),
        sb.from("streak_freezes").select("date")
          .eq("user_id", user.id)
          .gte("date", yearStart).lte("date", yearEnd),
        sb.from("profiles").select("created_at,is_pro").eq("id", user.id).maybeSingle(),
      ]);
    const completedByDate = new Map<string, number>();
    for (const r of (results ?? []) as { date: string; elapsed_seconds: number }[]) {
      completedByDate.set(r.date, r.elapsed_seconds);
    }
    const frozen = new Set<string>(((freezes ?? []) as { date: string }[]).map((f) => f.date));
    const signupDate = profile?.created_at
      ? new Date(profile.created_at).toISOString().slice(0, 10)
      : yearStart;
    series = assembleYearSeries({
      today,
      calendar: (cal ?? []) as any[],
      completedByDate,
      frozenDates: frozen,
      signupDate,
    });
    streak = computeUnifiedStreak(today, new Set(completedByDate.keys()), frozen);
    completedTodayElapsed = completedByDate.get(today);

    // Yesterday-missed-and-Pro freeze prompt
    if (profile?.is_pro) {
      const yest = new Date(today + "T00:00:00Z");
      yest.setUTCDate(yest.getUTCDate() - 1);
      const yestStr = yest.toISOString().slice(0, 10);
      const yestEntry = series.seals.find((s) => s.date === yestStr);
      if (yestEntry?.state === "empty") {
        const granted = `${yestStr.slice(0, 7)}-01`;
        const { count } = await sb
          .from("streak_freezes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("granted_month", granted);
        const used = count ?? 0;
        const allotment = computeAllotment(profile.created_at, granted);
        const remaining = Math.max(0, allotment - used);
        if (remaining > 0) freezePrompt = { date: yestStr, kanji: yestEntry.kanji, remaining };
      }
    }
  }

  // Ledger preview (existing logic)
  let preview: { rank: string; name: string; time: string; first: boolean }[] = NAMES_FALLBACK;
  try {
    const { data } = await sb
      .from("daily_results")
      .select("user_id,elapsed_seconds,profiles(username)")
      .eq("date", today)
      .order("elapsed_seconds", { ascending: true })
      .limit(3);
    const rows = (data ?? []) as unknown as LedgerRow[];
    if (rows.length) {
      preview = rows.map((r, i) => ({
        rank: (i + 1).toString().padStart(2, "0"),
        name: r.profiles?.username ?? "anon",
        time: formatHMS(r.elapsed_seconds),
        first: i === 0,
      }));
    }
  } catch {}

  return (
    <>
      <Masthead active="today" initial={initial} />

      <main className="px-6 lg:px-16 py-10 lg:py-14 max-w-[1480px] mx-auto">
        <div className="eyebrow red">{dateLine()}</div>

        <div className="mt-6">
          <TodayCard
            today={todaySeal}
            completedElapsed={completedTodayElapsed}
            streakDays={streak}
            freezePrompt={freezePrompt}
            tategakiDay={weekdayJp()}
          />
        </div>

        <section className="mt-14 relative">
          <div
            aria-hidden
            className="watermark-kanji hidden lg:block"
            style={{ fontSize: "200px", right: "-20px", top: "-20px" }}
          >
            刻
          </div>
          <div className="flex items-baseline justify-between mb-3 relative">
            <div className="eyebrow">global pace · today</div>
            <div className="mono text-[10px] tracking-[0.22em] text-moss/70 uppercase">
              live · refreshed every minute
            </div>
          </div>
          <div className="border-t border-b border-sumi/30 py-7 flex flex-col sm:grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-sumi/30 relative">
            <div className="pb-5 sm:pb-0 sm:pr-10">
              <div className="kdate-jp text-[44px] lg:text-[52px] font-semibold tnum leading-[0.95]">02:48</div>
              <div className="mono text-[10px] tracking-[0.22em] uppercase text-moss mt-3">
                first solve · <span className="text-vermillion">nurali, ала</span>
              </div>
            </div>
            <div className="py-5 sm:py-0 sm:px-10">
              <div className="kdate-jp text-[44px] lg:text-[52px] font-semibold tnum leading-[0.95]">14:52</div>
              <div className="mono text-[10px] tracking-[0.22em] uppercase text-moss mt-3">
                global median
              </div>
            </div>
            <div className="pt-5 sm:pt-0 sm:pl-10">
              <div className="kdate-jp text-[44px] lg:text-[52px] font-semibold tnum leading-[0.95]">2,184</div>
              <div className="mono text-[10px] tracking-[0.22em] uppercase text-moss mt-3">
                solving now
              </div>
            </div>
          </div>
        </section>

        {series && (
          <section className="mt-16 relative">
            <div
              aria-hidden
              className="watermark-kanji hidden lg:block"
              style={{ fontSize: "240px", right: "-30px", top: "-50px" }}
            >
              年
            </div>
            <div className="flex justify-between items-baseline mb-3 relative">
              <div className="flex items-baseline gap-4">
                <div className="eyebrow">your year</div>
                <div className="mono text-[11px] tracking-[0.18em] text-moss/70 tnum">
                  {series.seals.filter((s) => s.state === "filled" || s.state === "freeze").length}
                  {" / "}
                  {series.seals.length}
                </div>
              </div>
              <Link
                href="/year"
                className="mono text-[11px] tracking-[0.18em] uppercase text-vermillion hover:underline underline-offset-4"
              >
                view full year ↗
              </Link>
            </div>
            <div className="border-t border-b border-sumi/30 py-6">
              <YearScroll series={series} />
            </div>
          </section>
        )}

        <section className="mt-16 relative">
          <div
            aria-hidden
            className="watermark-kanji hidden lg:block"
            style={{ fontSize: "200px", right: "-20px", top: "-30px" }}
          >
            番
          </div>
          <div className="flex justify-between items-baseline mb-3 relative">
            <div className="eyebrow">ledger · ала today</div>
            <Link
              href="/leaderboard"
              className="mono text-[11px] tracking-[0.18em] uppercase text-vermillion hover:underline underline-offset-4"
            >
              see all ↗
            </Link>
          </div>
          <div className="border-t border-sumi/30 relative">
            {preview.map((row) => (
              <div
                key={row.rank}
                className="grid grid-cols-[44px_1fr_auto] gap-4 py-4 border-b border-sumi/12 items-baseline group"
              >
                <div className={"kdate-jp text-[16px] tnum " + (row.first ? "text-vermillion" : "text-moss")}>
                  {row.rank}
                </div>
                <div className="text-[15px] flex items-center gap-3">
                  {row.name}
                  {row.first && <span className="inline-seal" aria-hidden>一</span>}
                </div>
                <div className="mincho text-[18px] font-semibold tnum">{row.time}</div>
              </div>
            ))}
            <div className="text-center py-5 ital text-moss text-[14px]">
              <span className="text-vermillion mr-1">↘</span>
              your name lands when you finish.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-sumi/15 mt-16 px-6 lg:px-12 py-8 max-w-[1480px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-6 mono text-[10px] tracking-[0.2em] uppercase text-moss">
        <div>hako.app</div>
        <div>v1.0 · 8 may 2026</div>
      </div>
    </footer>
  );
}
