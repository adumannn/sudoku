# Real stats & leaderboards — design

**Date:** 2026-05-09
**Status:** Approved for planning

## Goal

Every visible number across home, leaderboard, profile, game header, and win modal must be computed from real user activity. No hardcoded fixtures, no seeded RNG, no demo fallbacks. Where data doesn't exist yet (e.g. early morning, no submissions), render an em-dash or a soft empty-state prompt — never a fake number.

## Non-goals (this round)

- No live updates. Page refresh shows new state; no websockets or polling.
- No materialized views or background rollups. Per-request compute backed by indexes; revisit only if a single query exceeds ~200ms.
- No internationalization of city names. Stored as user types; normalized `lower(trim(...))` for grouping. "Almaty" and "Алматы" stay separate buckets.
- No friend / follower leaderboards.
- No backfilling old `daily_results.city` rows. Historical rows keep their original Vercel-header value; the leaderboard groups them with new normalized values via `lower(trim(city))`.
- Heatmap shows daily stamps only, not casual play. Matches the existing "完 stamps" framing.

## Architecture

Per-request compute from `daily_results`, `games`, `daily_puzzles`, `profiles`, `streak_freezes`, with one new column (`daily_puzzles.seq`) and two new indexes. All page-level computation goes through three helpers in `lib/stats/leaderboard.ts` so query logic doesn't sprawl across pages.

Considered alternatives:

- **Materialized views / nightly cron rollups.** Faster at scale; two extra moving parts (the cron, the schema) for stats that are not slow yet. Defer.
- **Edge cache the API responses with `revalidate`.** Works for global aggregates but produces stale "you" rows because percentile depends on `auth.uid()`. Hard to reason about correctness. Defer.

## Migration: `0007_real_stats.sql`

```sql
-- Persistent daily number, set when each daily is seeded; survives gaps/deletes.
create sequence if not exists daily_puzzles_seq_seq;

alter table public.daily_puzzles
  add column seq int unique default nextval('daily_puzzles_seq_seq');

-- Backfill existing rows in date order.
with ordered as (
  select date, row_number() over (order by date) as n
  from public.daily_puzzles
)
update public.daily_puzzles dp
   set seq = o.n
  from ordered o
 where dp.date = o.date;

-- Advance the sequence past the backfilled values so future inserts continue
-- counting up rather than colliding with backfilled numbers.
select setval(
  'daily_puzzles_seq_seq',
  coalesce((select max(seq) from public.daily_puzzles), 0)
);

alter table public.daily_puzzles
  alter column seq set not null;

-- Index for "solving now" — !complete games with recent activity.
create index games_active_idx on public.games(updated_at desc)
  where is_complete = false;

-- Index for percentile / rank queries on a given city/date.
create index daily_results_city_idx
  on public.daily_results(date, city, elapsed_seconds);
```

Because `seq` defaults to `nextval(...)`, no insert path needs to be updated — `scripts/seed-puzzles.ts` and any future daily-puzzle insertion will get the next number automatically. Post-migration verification: `select count(*) from daily_puzzles where seq is null` must return 0, and `select min(seq), max(seq), count(*) from daily_puzzles` must show `min=1`, `max=count`.

## City picker

`profiles.city` already exists, is world-readable, and is self-update via the `profiles_self_update` policy. We just need to surface it.

**UI placement:**

- **Profile page:** small "your city" field above the stats grid, with a `change` link that toggles an inline editor. No modal, no separate settings page.
- **Home page:** when a signed-in user has `profiles.city = null`, render a one-line banner above the today card: *"Pick your city so you appear on the right ledger."* with the picker inline. Banner disappears once city is set.

**Picker UX (`components/profile/CityPicker.tsx`):**

- Default suggestion from Vercel's `x-vercel-ip-city` header (server-rendered into the picker as the placeholder/preselected value).
- Combobox: top results are existing cities sorted by descending solver count (`select lower(trim(city)) as c, count(*) from daily_results group by c order by count desc limit 20`), with the user's own freeform input as a fallback option.
- One-line ital text: *"stored on your profile · changes from now on, past results keep their city."*
- Server action `app/actions/save-city.ts` — takes `{ city: string }`, normalizes `lower(trim(value))`, updates `profiles.city` for `auth.uid()`, returns the saved value. Empty string clears the field.

**Submit endpoint (`app/api/daily/submit/route.ts`):**

- Read `profiles.city` first; if non-null, use that.
- Fall back to `getCity()` (Vercel header) only when `profiles.city` is null.
- This means everything submitted after a user picks a city uses the canonical normalized value, while users who never pick still get an IP-based grouping.

## Computed values

For each placeholder, the source and formula. Helpers live in `lib/stats/leaderboard.ts`.

### Helper: `getDailySnapshot(date, sb)`

Returns `{ seq, firstSolve, median, solvingNow, totalSubmitted }`.

- `seq` — `daily_puzzles.seq` for `date`.
- `firstSolve` — `select user_id, elapsed_seconds, city from daily_results where date = $1 order by elapsed_seconds asc limit 1` joined to `profiles.username`.
- `median` — `select percentile_cont(0.5) within group (order by elapsed_seconds) from daily_results where date = $1`. Returned as integer seconds.
- `solvingNow` — `select count(*) from games where is_complete = false and updated_at > now() - interval '15 minutes'`. Uses `games_active_idx`.
- `totalSubmitted` — `select count(*) from daily_results where date = $1`.

If the daily has no submissions yet, `firstSolve`, `median`, `totalSubmitted` are null/0; consumers render em-dashes.

### Helper: `getCityLeaderboard(date, range, city, sb)`

`range` is `'today' | '7d' | 'all'`.

Returns `{ rows, cityCounts, total }`.

- `rows` — top 20 rows. SQL varies by range:
  - `today`: `select user_id, elapsed_seconds, city, created_at, hints_used from daily_results where date = $1 [and lower(trim(city)) = $2] order by elapsed_seconds asc limit 20`.
  - `7d`: best `elapsed_seconds` per user across last 7 days. To handle users who appear in multiple cities over the window, take the city from the row that produced the best time: `select distinct on (user_id) user_id, elapsed_seconds, city, created_at from daily_results where date >= today - 6 [and lower(trim(city)) = $2] order by user_id, elapsed_seconds asc`, then re-sort by `elapsed_seconds` and `limit 20` in the caller (or wrap in a subquery).
  - `all`: same as `7d` but without the date predicate.
- `cityCounts` — `select lower(trim(city)) as c, count(*) as n from daily_results where date = $1 [or appropriate range] and city is not null group by c order by n desc limit 12`. The user's own city is always included even if zero, by union-ing in `select profiles.city, 0 where profiles.id = auth.uid()`.
- `total` — `count(*)` over the same date range, no city filter.

`profiles.username` is joined into rows for display.

### Helper: `getUserDailyStanding(date, userId, sb)`

Returns `{ time, city, rankInCity, percentile, citySize } | null`.

- Look up the user's row: `select elapsed_seconds, lower(trim(city)) as c from daily_results where date = $1 and user_id = $2`. If absent, return `null`. (City is taken from the row itself, not from `profiles.city`, so the standing reflects where the user was when they submitted.)
- `rankInCity` — `1 + count(*) where date = $1 and lower(trim(city)) = $c and elapsed_seconds < $time`.
- `citySize` — `count(*) where date = $1 and lower(trim(city)) = $c`.
- `percentile` — `round(100 * (1 - rankInCity / citySize))`.

### Helper: `getUserHeatmap(userId, today, sb)`

Returns `HeatDay[]` of length 182 (oldest first) where `HeatDay = { date: string; level: 0 | 1 | 2 | 3 }`.

- Compute `windowStart = today - 181 days`.
- One query: `select dr.date, dr.elapsed_seconds, day_median.median from daily_results dr left join lateral (select percentile_cont(0.5) within group (order by elapsed_seconds) as median from daily_results where date = dr.date) day_median on true where dr.user_id = $1 and dr.date between $2 and $3`.
- One query for freezes: `select date from streak_freezes where user_id = $1 and date between $2 and $3`.
- Build a `Map<date, level>` with default 0; set 1 for freeze dates; set 2 for completed; promote to 3 when `elapsed_seconds < median`.
- Emit 182 entries iterating from `windowStart` to `today`.

### Page mappings

| Display | Source / formula |
|---|---|
| Home — `02:48` first solve | `snapshot.firstSolve.elapsedSeconds` |
| Home — `nurali, ала` byline | `snapshot.firstSolve.username + lower(trim(city))` |
| Home — `14:52` global median | `snapshot.median` |
| Home — `2,184` solving now | `snapshot.solvingNow` |
| Home — ledger preview | unchanged (already real) |
| Leaderboard — `daily № 0472` | `snapshot.seq` |
| Leaderboard — top 20 rows | `getCityLeaderboard(...).rows` |
| Leaderboard — city sidebar list + counts | `getCityLeaderboard(...).cityCounts` |
| Leaderboard — `8,442` all-cities total | `getCityLeaderboard(date, range, null).total` |
| Leaderboard — "you" row rank/time/percentile | `getUserDailyStanding` |
| Profile — `since 6 february` | `profiles.created_at` formatted `"D MMMM"` lowercased |
| Profile — recent daily label | latest `daily_results` for user joined `daily_puzzles`: `seq + date + difficulty` |
| Profile — heatmap | `getUserHeatmap(userId, today, sb)` |
| Profile — "faster than median in ала" | `snapshot.median` vs user's today time, in user's city |
| Game header / Win modal — `Daily № 0472` | `daily_puzzles.seq` for that date |

### Heatmap data shape

`components/stats/Heatmap.tsx` props change from `{ weeks?, seed? }` to `{ days: HeatDay[] }` where `HeatDay = { date: string; level: 0 | 1 | 2 | 3 }`. The page passes 182 entries (26 weeks × 7 days), oldest first.

Level rules:

- `0` — no daily_result, no freeze.
- `1` — `streak_freezes` row for that date.
- `2` — `daily_result` exists.
- `3` — `daily_result` exists AND `elapsed_seconds < that day's global median`.

Level computation lives in `getUserHeatmap` (see helpers above).

## Empty-state copy

- Home stats with no data today: render `—` (em-dash) in place of numbers, byline reads `awaiting first solve`.
- Leaderboard with no data today + no demo: top of table reads italic *"the ledger fills as solvers finish today's box."* Existing demoRows / fixture / NAMES_FALLBACK delete entirely.
- Leaderboard "you" row when user hasn't solved today: italic *"finish today's box to land on the ledger."*
- Profile heatmap with no data: render the empty grid (all level=0); existing month-label row stays.
- Profile achievements with no data: drop `DEMO_STATUSES` fallback; `AchievementsLedger` already handles all-locked correctly.

## Per-page change list

| File | Change |
|---|---|
| `supabase/migrations/0007_real_stats.sql` | new — column + indexes |
| `lib/stats/leaderboard.ts` | new — `getDailySnapshot`, `getCityLeaderboard`, `getUserDailyStanding` |
| `lib/stats/heatmap.ts` | new — `getUserHeatmap` |
| `app/page.tsx` | call `getDailySnapshot`; replace hardcoded global pace; drop `NAMES_FALLBACK`; show city-picker banner when `profile.city == null` |
| `app/leaderboard/page.tsx` | drop `KZ_CITIES`, `demoRows`, `fixture`, hardcoded daily № and "you" row; wire `range` pills to today/7d/all; render empty states |
| `app/profile/page.tsx` | format `profile.created_at`; query last daily for recent-label + seq; pass real data to Heatmap; real "faster than median" comparison; drop `DEMO_STATUSES`; add `<CityPicker>` |
| `components/stats/Heatmap.tsx` | new prop shape `{ days }` |
| `components/profile/CityPicker.tsx` | new — combobox + freeform |
| `app/actions/save-city.ts` | new server action |
| `app/api/daily/submit/route.ts` | use `profiles.city` first, Vercel header as fallback |
| `components/game/GameShell.tsx` | accept and use `dailyNumber` |
| `components/game/WinModal.tsx` | read `dailyNumber` from game-store |
| `lib/store/game-store.ts` | add `dailyNumber?: number` to state and `load()` |
| `app/play/daily/page.tsx` | select `seq` and pass to `GameShell` |

## Testing

Vitest covers the pure logic — query results are mocked into the helpers' inputs, formulas are asserted.

- `lib/stats/leaderboard.test.ts` — `getDailySnapshot`, `getCityLeaderboard`, `getUserDailyStanding` with handcrafted result sets covering: empty data, single solver, ties, missing user row, missing city, today-vs-7d-vs-all-time ranges.
- `lib/stats/heatmap.test.ts` — `getUserHeatmap` level computation: empty/freeze/completed/completed-fast.
- Existing tests stay green.

The Supabase calls themselves are not unit tested (they hit RLS and the actual DB shape); manual smoke test on dev covers integration.

## Performance budget

- Each helper is one or two indexed queries. Expected duration on the existing dev DB: <30 ms per call. Target sub-100 ms total per page.
- The home page now makes one extra call (`getDailySnapshot`); profile makes one extra (recent-daily seq lookup); leaderboard's load is unchanged in shape, plus one cityCounts query.
- If any single query crosses 200 ms in production, revisit: candidate next steps are (a) a materialized `daily_stats` view refreshed by a Supabase scheduled function, or (b) edge caching on the home snapshot only.

## Risks

- **Daily seq backfill mis-orders.** Mitigation: the `with ordered as (...)` window orders by `date` so seq matches calendar order. Post-migration assertion is documented in the migration section.
- **City normalization collisions** (`"NYC"` vs `"New York"`). Out of scope; we accept fragmentation.
- **`profiles.city` privacy.** Profiles are world-readable. Anyone can read anyone's city. This matches the existing username surface; no change in trust model.
- **`solving now` overcount during outage replay.** If the games table has stale `updated_at` rows (e.g. abandoned tabs), the count over-reports. The 15-minute window already mitigates; if it gets noisy, narrow to 5 minutes.
