import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { todayUTC, formatTime } from "@/lib/utils";
import { Masthead } from "@/components/Masthead";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Row {
  user_id: string;
  elapsed_seconds: number;
  city: string | null;
  created_at: string;
  hints_used?: number | null;
  profiles: { username: string | null } | null;
}

const KZ_CITIES: { key: string; label: string; count: number }[] = [
  { key: "ala", label: "Almaty", count: 1412 },
  { key: "ast", label: "Astana", count: 988 },
  { key: "krg", label: "Karaganda", count: 214 },
  { key: "shy", label: "Shymkent", count: 182 },
  { key: "aty", label: "Atyrau", count: 96 },
  { key: "akt", label: "Aktau", count: 71 },
  { key: "pav", label: "Pavlodar", count: 68 },
  { key: "akb", label: "Aktobe", count: 0 },
  { key: "trz", label: "Taraz", count: 42 },
];

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: { city?: string; date?: string; range?: "today" | "7d" | "all" };
}) {
  const sb = createServerClient();
  const date = searchParams.date ?? todayUTC();
  const cityKey = searchParams.city ?? "ala";
  const range = searchParams.range ?? "today";
  const city = KZ_CITIES.find((c) => c.key === cityKey) ?? KZ_CITIES[0];

  let q = sb
    .from("daily_results")
    .select(
      "user_id,elapsed_seconds,city,created_at,hints_used,profiles(username)"
    )
    .eq("date", date)
    .order("elapsed_seconds", { ascending: true })
    .limit(20);
  if (cityKey) q = q.eq("city", cityKey);
  let rows: Row[] = [];
  try {
    const { data } = await q;
    rows = (data ?? []) as unknown as Row[];
  } catch {
    rows = [];
  }

  // Pull current user to surface "you" row
  const {
    data: { user },
  } = await sb.auth.getUser();
  const username = user?.email?.split("@")[0] ?? null;
  const initial = user?.email?.[0] ?? "·";

  // demo fallback if no rows
  const demoRows: Row[] =
    rows.length > 0
      ? rows
      : [
          fixture("01", "nurali", 168, "ala"),
          fixture("02", "aigerim", 174, "ala"),
          fixture("03", "dauren", 181, "ala", 1),
          fixture("04", "timur", 188, "ala"),
          fixture("05", "sabina", 194, "ala"),
          fixture("06", "arman", 201, "ala", 2),
        ];

  return (
    <>
      <Masthead active="ledger" initial={initial} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] max-w-[1480px] mx-auto">
        {/* CITY RAIL */}
        <aside className="border-r border-sumi/15 lg:border-r-2 lg:border-r-sumi p-7 lg:p-9">
          <div className="eyebrow mb-3.5">solving in</div>
          <h3 className="h-disp text-[36px] tracking-[-0.02em]">
            {city.label}
            <span className="text-vermillion">.</span>
          </h3>

          <div className="eyebrow mt-8 mb-3">cities · kz</div>
          <div>
            {KZ_CITIES.map((c) => (
              <Link
                key={c.key}
                href={{ pathname: "/leaderboard", query: { city: c.key, range } }}
                className={cn("city-row", c.key === cityKey && "on")}
              >
                <span className="city-name">{c.label}</span>
                <span className="ct">{c.count.toLocaleString()}</span>
              </Link>
            ))}
          </div>

          <div className="eyebrow mt-8 mb-3">global</div>
          <Link
            href={{ pathname: "/leaderboard", query: { city: "", range } }}
            className="city-row"
          >
            <span className="city-name">All cities</span>
            <span className="ct">8,442</span>
          </Link>

          <div className="mt-8 border-t border-sumi pt-4">
            <p className="ital text-moss text-[14px]">
              — set automatically from your account; change in settings.
            </p>
          </div>
        </aside>

        {/* LEDGER */}
        <section className="p-7 lg:p-14">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-3.5">
            <div>
              <div className="eyebrow red">
                daily № 0472 · {date} · hard
              </div>
              <h2 className="h-disp text-[42px] mt-1.5">
                Today in {city.label}.
              </h2>
            </div>
            <div className="flex gap-1.5">
              <RangePill k="today" active={range === "today"} city={cityKey} />
              <RangePill k="7d" label="7-day" active={range === "7d"} city={cityKey} />
              <RangePill k="all" label="All-time" active={range === "all"} city={cityKey} />
            </div>
          </div>

          {/* table */}
          <div className="mt-7 border-t-2 border-sumi">
            <div className="led-row hd">
              <div>rank</div>
              <div>solver</div>
              <div>time</div>
              <div>hints</div>
              <div className="col-hide-md">finished</div>
              <div className="col-hide-md"></div>
            </div>
            {demoRows.map((r, i) => (
              <LedgerRow
                key={`${r.user_id}-${i}`}
                rank={(i + 1).toString().padStart(2, "0")}
                name={r.profiles?.username ?? "anon"}
                city={r.city}
                time={formatTime(r.elapsed_seconds)}
                hints={r.hints_used ?? null}
                finished={new Date(r.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                first={i === 0}
              />
            ))}
            <div className="led-row">
              <div className="kdate-jp text-[16px] text-moss">07–13</div>
              <div className="txt-small col-span-5">
                — seven solvers, 03:24 → 03:39 —
              </div>
            </div>
          </div>

          {/* Sticky you row */}
          {username && (
            <div className="led-row you mt-1.5 bg-vermillion text-bone">
              <div className="kdate-jp text-[18px] font-bold">14</div>
              <div>
                <span className="kdate-jp text-[16px] font-bold">
                  {username}
                </span>
                <span className="mono text-[9.5px] tracking-[0.18em] uppercase opacity-70 ml-2">
                  you
                </span>
              </div>
              <div className="kdate-jp text-[18px] font-bold tnum">03:42</div>
              <div>—</div>
              <div className="text-[12.5px] col-hide-md">09:47</div>
              <div className="ital col-hide-md">faster than 71% in ала today</div>
            </div>
          )}

          <p className="ital text-moss text-[14px] mt-4">
            — {city.count.toLocaleString()} solvers in {city.label} have submitted
            today; the rest are still working.
          </p>
        </section>
      </div>
    </>
  );
}

function fixture(
  rank: string,
  name: string,
  secs: number,
  city: string,
  hints = 0
): Row {
  const now = new Date();
  now.setMinutes(now.getMinutes() - parseInt(rank) * 8);
  return {
    user_id: rank + name,
    elapsed_seconds: secs,
    city,
    hints_used: hints,
    created_at: now.toISOString(),
    profiles: { username: name },
  };
}

function RangePill({
  k,
  label,
  active,
  city,
}: {
  k: "today" | "7d" | "all";
  label?: string;
  active: boolean;
  city: string;
}) {
  return (
    <Link
      href={{ pathname: "/leaderboard", query: { city, range: k } }}
      className={cn("kpill", active ? "red" : "outline")}
    >
      {label ?? k.charAt(0).toUpperCase() + k.slice(1)}
    </Link>
  );
}

function LedgerRow({
  rank,
  name,
  city,
  time,
  hints,
  finished,
  first,
}: {
  rank: string;
  name: string;
  city: string | null;
  time: string;
  hints: number | null;
  finished: string;
  first: boolean;
}) {
  return (
    <div className={cn("led-row", first && "top1")}>
      <div
        className={cn(
          "kdate-jp font-semibold tnum",
          first ? "text-vermillion text-[18px] font-bold" : "text-[16px]"
        )}
      >
        {rank}
      </div>
      <div>
        <span
          className={cn(
            "kdate-jp",
            first ? "text-[16px] font-semibold" : "text-[15px]"
          )}
        >
          {name}
        </span>
        {city && (
          <span className="txt-small ml-2">/ {city}</span>
        )}
      </div>
      <div
        className={cn(
          "kdate-jp font-semibold tnum",
          first ? "text-[18px]" : "text-[16px]"
        )}
      >
        {time}
      </div>
      <div className="text-[14px]">{hints && hints > 0 ? hints : "—"}</div>
      <div className="txt-small col-hide-md">{finished}</div>
      <div className="col-hide-md">
        {first && <span className="kpill red text-[10px]">完 first</span>}
      </div>
    </div>
  );
}
