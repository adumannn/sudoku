# Today's Seal — Daily Engagement Flagship — Design

**Date:** 2026-05-09
**Status:** drafted (awaiting user review)
**Scope:** A flagship daily-return system. Each calendar date has a featured kanji that becomes the vermillion-marked seal stamped on completion. All 365 seals accumulate on a vertical year-scroll surfaced as the home page's main artifact. Today's empty seal pulses; missed days stay empty for free users. Pro tier gets a small monthly allotment of "streak freezes" that mark a missed day as kept.

## Goals

1. **Hook** — give players a concrete reason today is different from yesterday: a unique character, a unique seal, an empty box on the year-scroll that pulls the eye.
2. **Artifact** — make the year visible. The scroll is on the home page, always. Inked progress accumulates; missed days remain visible as gaps.
3. **Continuity** — soften the cliff between a perfect streak and starting over. Pro freezes give committed players a 1–2/month safety net without dulling the urgency for everyone else.

## Non-goals

- No new puzzle modes. The daily puzzle itself, its generator, validation, and leaderboard are unchanged.
- No themed weeks, seasonal arcs, or hand-authored Sensei content. The kanji bank is a curated rotation; Sensei lines are generated at request time.
- No multi-language seals. Kanji only.
- No retroactive backfill of past seals from existing `daily_results` for current users beyond rendering them — i.e., the *visual* of a user's prior completions appears in the scroll, but no new database events are emitted for historical days.
- No share-card preview before solving. Share is post-solve only.
- No replay of past dailies from the scroll. Tapping a past stamped seal opens a read-only popover.

---

## 1. Architecture overview

Three new pieces of state, three new components, two new endpoints, one extension to the win-modal.

**State (Postgres):**

- `daily_seal_calendar` — maps each calendar date to its kanji. Server-owned, populated in advance.
- `daily_seal_lines` — caches the Sensei micro-line per date (shared across users).
- `streak_freezes` — ledger of Pro-tier freezes (allocated, used). Drives the unified streak calc.

**Components:**

- `<YearScroll />` — the 52-week × 7-day vertical scroll surface.
- `<Seal />` — the single-cell seal element with `filled | today | empty | future | freeze | pre-signup` states.
- `<TodayCard />` — the home page hook: today's pulsing empty seal, kanji name + romaji, Sensei micro-line, play CTA, streak label. Renders a "stamped" variant once today's seal is set.
- `<ScrollContextStrip />` — the 9-cell horizontal strip used inside `<WinModal />`.
- `<SealPopover />` — the read-only past-day detail popover.

**Endpoints:**

- `GET /api/seal/today` — returns today's date, kanji, romaji, Sensei micro-line.
- `GET /api/seal/year` — returns the user's 365-day seal series for the current calendar year.
- `GET /api/share/seal/[date]` — generates the share PNG for a given date (V4 single-seal layout).
- `POST /api/seal/freeze` — applies a streak freeze to a missed date (Pro-only).

**Modified:**

- `WinModal.tsx` — appends a "scroll context" strip showing today's seal slotting into the surrounding nine days.
- `Masthead.tsx` — drops the existing `<StreakBadge />`. Streak count moves to `<TodayCard />`.
- `app/page.tsx` (home) — restructured around the `<TodayCard />` + `<YearScroll />` pair.

---

## 2. Data model

### `daily_seal_calendar`

Server-owned mapping from date → kanji. Pre-populated for the current and next calendar year so all clients see the same kanji on the same UTC date.

```sql
create table public.daily_seal_calendar (
  date date primary key,
  kanji text not null,           -- single-character kanji glyph, e.g. '月'
  romaji text not null,          -- e.g. 'tsuki'
  meaning text not null          -- short English gloss, e.g. 'moon'
);
alter table public.daily_seal_calendar enable row level security;
create policy daily_seal_calendar_world_read
  on public.daily_seal_calendar for select using (true);
```

Population is via a script (`scripts/seed-seal-calendar.ts`) that reads from a curated kanji bank (see §3) and assigns one entry per date over a 730-day window. No client-side fallback — if the calendar is empty for today, the home page degrades gracefully (no kanji shown; today still tappable).

### `daily_seal_lines`

```sql
create table public.daily_seal_lines (
  date date primary key references public.daily_seal_calendar(date) on delete cascade,
  line text not null,
  generated_at timestamptz not null default now()
);
alter table public.daily_seal_lines enable row level security;
create policy daily_seal_lines_world_read
  on public.daily_seal_lines for select using (true);
```

The line is generated server-side on first read of `/api/seal/today` for that date and persisted. Service role inserts; clients only read.

### `streak_freezes`

```sql
create table public.streak_freezes (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,                  -- the missed date this freeze covers
  granted_month date not null,         -- first-of-month for monthly allotment
  granted_at timestamptz not null default now(),
  primary key (user_id, date)
);
alter table public.streak_freezes enable row level security;
create policy streak_freezes_owner_all on public.streak_freezes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Each row records that the user spent one freeze on a specific missed date. `granted_month` is used to enforce the per-month allotment (default 2/month for Pro; 0 for free).

### Streak calculation

A new server function `compute_unified_streak(user_id) returns int` walks back from today through:

- `daily_results` rows (completed)
- `streak_freezes` rows (accepted as "kept")

The streak ends at the first date with neither. Used by:

- `<TodayCard />` (display)
- `lib/achievements.ts` (`streak_7`, `streak_30`, `streak_100` — replaces in-memory `dailyStreakLength`).

### Existing tables — unchanged

`daily_results`, `daily_puzzles`, `games`, `profiles`, `ai_usage` are untouched. The seal artifact is read-derived: a date is "filled" iff a `daily_results` row exists for `(user_id, date)`.

---

## 3. Kanji bank + per-date assignment

A curated bank of ~600 kanji is bundled in `lib/kanji-bank.ts` (typed entries: `{ kanji, romaji, meaning, themes: string[] }`). Themes drive light variation but are not surfaced to the player.

### Assignment rules (in order)

1. **Reserved dates** — solstices, equinoxes, new-year, mid-year get themed kanji (春 spring equinox, 夏 summer solstice, 秋 autumn equinox, 冬 winter solstice, 元 Jan 1, etc.).
2. **Day-of-week alignment is *not* enforced.** Earlier mockups showed 月 on Monday — that was illustrative only. Forcing the weekday kanji on its day creates predictable repetition; the bank's variety is part of the hook.
3. **No repeats within a 365-day window.** The seed script enforces this.
4. **Deterministic by date.** Once seeded, a date's kanji is fixed. The script never rewrites past dates.

Population script runs at deploy time to extend the calendar 365 days into the future.

### Sundays / months / year boundaries

No special "rest" treatment for Sundays. Every day has a kanji. Month and year boundaries are visually marked by the scroll's typography, not by changing the seal.

---

## 4. APIs

### `GET /api/seal/today`

Auth optional (Sensei line is the only auth-gated piece).

Response:
```json
{
  "date": "2026-05-09",
  "kanji": "月",
  "romaji": "tsuki",
  "meaning": "moon",
  "senseiLine": "Quiet, persistent. Begins the week without announcing itself."
}
```

`senseiLine` is generated by a server-side call to Claude Haiku (already in use for the coach at `lib/coach/`). System prompt constrains: ≤ 14 words, present tense, no spoilers about the puzzle, tonally aligned with the existing Sensei voice. The line is cached in a `daily_seal_lines` table keyed by `date` (one shared line per date across all users) and generated lazily on the first request of the day. Subsequent reads are a single index lookup.

### `GET /api/seal/year`

Auth required. Returns the user's series for the current calendar year:

```json
{
  "year": 2026,
  "today": 128,
  "seals": [
    { "date": "2026-01-01", "kanji": "元", "state": "filled", "elapsedSeconds": 312 },
    { "date": "2026-01-02", "kanji": "雪", "state": "empty" },
    { "date": "2026-01-03", "kanji": "山", "state": "freeze" },
    ...
    { "date": "2026-05-09", "kanji": "月", "state": "today" },
    { "date": "2026-05-10", "kanji": "火", "state": "future" }
  ]
}
```

`state` is one of: `filled` (completed), `empty` (missed, no freeze), `freeze` (missed, freeze applied), `today`, `future`. The server joins `daily_seal_calendar` with the user's `daily_results` and `streak_freezes` for the year.

---

## 5. `<Seal />` component

A single cell. Props: `kanji?`, `state`, `size?`, `onClick?`.

Visual states (all use Hako tokens — bone background, sumi ink, vermillion accent):

- **filled** — sumi kanji on a `rgba(sumi/0.03)` tile, 1px sumi border at 0.32 alpha. Lower-right corner: a 14–24px vermillion `✓` hanko in a 50% circle, rotated −6deg.
- **today** — empty interior (no kanji on the home scroll; the `<TodayCard />` shows the kanji preview separately), 1.5px vermillion border at 0.7 alpha, low-opacity vermillion fill, infinite 1.8s pulse animation (transform + box-shadow).
- **empty** — dashed sumi border at 0.16 alpha, no fill. Communicates "missed."
- **future** — solid sumi border at 0.07 alpha. Quiet placeholder, no kanji.
- **freeze** — dashed vermillion border (0.4 alpha) + a 「凍」 glyph in a corner badge (instead of `✓`). Reads "kept by freeze."
- **pre-signup** — for users whose account didn't exist on that date. Solid sumi border at 0.04 alpha, no fill, no kanji. Reads as "you weren't here yet" — visually distinct from `empty` (missed) so first-time players mid-year don't feel scolded for the months before they joined.

Size variants:
- `sm` — scroll cells (~28–32px)
- `md` — share-card / scroll-context strip (~56–96px)
- `lg` — win-modal hero + today-card preview (160–168px)

The pulse animation respects `prefers-reduced-motion`.

---

## 6. `<YearScroll />` component

Layout B from brainstorming: 52 weeks × 7 days, weekday columns labeled with weekday kanji `月 火 水 木 金 土 日` at the top.

- Container: `display: grid; grid-template-columns: 36px repeat(7, 1fr); gap: 4px;`
- Leftmost column: every-fourth-week labels (`w01`, `w05`, ...) in mono.
- Cells: `<Seal size="sm" state={...} kanji={...} />`.
- On mount, scrolls today's row to vertical center.
- Tap a `filled` seal → `<SealPopover />` (date, kanji, romaji, meaning, your time, "view that day's daily" link).
- Tap `today` → routes to `/play/daily`.
- Tap `freeze` → `<SealPopover />` (date, kanji, "kept by freeze").
- Tap `empty` / `future` / `pre-signup` → no-op (or, for `empty`, a small "you missed this day" tooltip on hover/long-press).

Dates before `profile.created_at` render in the `pre-signup` state. The user sees the kanji bank ahead of their signup as quiet placeholders, not gaps to fill.

Max height is set on the container so the year-scroll fits comfortably under the today-card on the home page; users scroll inside the surface (not the page) to navigate the year. On `< sm`, the scroll is the full page width minus margins.

A `<YearScroll variant="full" />` mode is available for a possible future `/scroll` route, full-window. Not used in v1.

---

## 7. `<TodayCard />` + home page integration

Home page restructure (`app/page.tsx`):

```
[Masthead — no streak badge]
[TodayCard — hero]
[YearScroll — below, scrolls within itself]
[Existing: global pace stats + ledger preview — pushed below the fold]
```

`<TodayCard />` layout (Layout L2 from brainstorming):

- Left: a 96×96px `<Seal size="lg" state="today" kanji={today.kanji} />`. Even though scroll-context `today` cells render empty, this hero shows the kanji preview at the same vermillion-pulsing border (purposefully different — the player sees what they're about to stamp).
- Right column:
  - Eyebrow: `FRI · 2026-05-09 · TODAY'S CHARACTER` (mono, 10px, letterspaced).
  - Headline: `月 — moon · tsuki` (mincho, 22px).
  - Sensei line: `"Quiet, persistent. Begins the week without announcing itself."` (italic Cormorant Garamond, 13px).
  - CTA: a primary `play today` button (sumi background, bone text, mono uppercase) + a secondary mono link `streak · 14d` in vermillion.

Streak label inline with the CTA replaces the existing `<StreakBadge />`. When streak == 0, the label hides (no awkward "streak · 0d").

### Post-solve state of `<TodayCard />`

After today's daily is completed (the page is reloaded or the modal is closed and the user returns to the home page), the today-card switches to a quieter "stamped" variant:

- The hero seal renders in the `filled` style (sumi kanji + vermillion `✓` corner mark) instead of pulsing-empty.
- The eyebrow becomes `STAMPED · 04:23`.
- The Sensei line stays.
- The CTA changes from `play today` to a secondary-style `share` link, plus a tomorrow-preview row: `tomorrow · sat · {kanji-blank}` (no spoilers — the kanji is hidden until tomorrow).

### Casual play access

The masthead nav already contains `today / casual / ledger / stats / pro`. Casual stays in the nav. The home page no longer needs a separate Casual hero card — the casual link in the nav suffices, and the home page's purpose tightens to "today's ritual."

### Acceptance

- Loading the home page authenticated, post-completion, shows today's seal as a `filled` cell on the scroll and a sumi-toned "stamped" preview in the today-card with the message "today's seal is set" and a "tomorrow" affordance.
- Loading the home page authenticated, pre-completion, shows today's seal as a vermillion-pulsing empty cell in both surfaces, with the play CTA.
- The scroll's today-row is centered on mount.

---

## 8. Win modal: scroll-context payoff

Modify `components/game/WinModal.tsx`:

- The seal hero is the day's kanji at 160px in V4 styling (sumi kanji + vermillion corner mark).
- The existing `SealBurst` (vermillion ray emission) is **kept** and re-anchored to the seal-hero center (per the in-flight UI/UX spec §3 SealBurst origin fix). It runs over the kanji-bloom — both animations together create the stamp moment.
- New: a kanji-bloom animation. The kanji glyph fades in from blur(4px)+scale(0.6) into its final position over 700ms (eased), starting at `t = 350ms` after modal open. At `t = 1100ms`, the vermillion `✓` hanko corner-mark presses in over 600ms (rotated −20deg → −6deg, scale 1.6 → 1.0).
- Below the seal + time line, a new `<ScrollContextStrip />` appears at `t = 1500ms`: a dashed-divider with "your year · {n}/365" label and a 9-cell horizontal strip showing today's seal flanked by the four prior and four following days. Today's cell scales-in from 0.4 with a brief vermillion ring pulse, reinforcing the artifact-being-built.
- Actions: `tomorrow →` (primary, sumi background) and `share` (secondary).

The existing daily submission flow (server validation, leaderboard insert) is unchanged. The 700ms modal-defer from the in-flight UI/UX spec still applies; the kanji-bloom timing slots into that delay window.

### Acceptance

- After completing today's daily, the modal opens, the kanji blooms, the corner mark presses, the scroll-context strip animates today into place.
- Replaying the modal (close / reopen) re-runs the animation from the start.

---

## 9. Share card

Layout S1 — minimal single-seal poster.

- 1080×1080 PNG, generated server-side via `@vercel/og` at `GET /api/share/seal/[date]`.
- Background: bone (#f5efe2) with the existing dot-paper texture.
- Centered: a 168×168 V4 seal, kanji at 110px mincho, vermillion corner mark.
- Eyebrow corner-marks (top-left + bottom-right inset corners).
- Top-right: small vermillion 箱 stamp, rotated −4deg.
- Below seal: `04:23 · streak 14d · day 129/365` (mono, letterspaced, sumi text + vermillion streak count).
- Footer left: `HAKO · 2026.05.09` (mono micro).
- Footer right: `hako.app` (mono micro).

Spoiler-free by construction — no puzzle state shown. The image is the same kanji for everyone on a given date, so sharing it does not reveal anything about that day's puzzle.

The share button on `<WinModal />` opens the platform share sheet with a generated URL; the URL hits `/api/share/seal/[date]` and serves the PNG.

### Acceptance

- Sharing on a real device produces an image that opens cleanly in iMessage, Twitter, and Instagram preview.
- Image generation completes under 600ms p95 for a cold serverless invocation.

---

## 10. Pro: streak freezes

### Allotment

- Free tier: 0 freezes/month.
- Pro tier: 2 freezes/month, allotted on the 1st of each month at 00:00 UTC. The unified streak walks UTC dates, consistent with the existing daily flow.

Allotment is implicit — no row is written when granted. A user has remaining = `2 - count(streak_freezes where granted_month = current_month and user_id = me)`, gated by `is_pro`. New Pro signups mid-month receive a pro-rated allotment of 1 freeze for the partial month (enforced server-side: when checking `remaining`, the server uses `min(2, ceil((days_left_in_month / days_in_month) * 2))` rounded up, capped at 2).

### Application UX

Two entry points:

1. **Reactive** — when the user opens the app and the previous UTC date has no `daily_results` and no existing `streak_freezes` row, the today-card shows an additional row above the Sensei line: `"yesterday's seal — 火 — was missed. apply a freeze? (1 of 2 left this month)"`. Tap → confirm dialog → write a freeze row with `date = yesterday, granted_month = first-of-current-month`.
2. **Retroactive (within 24h only)** — same flow, but allowed for any single date within the last 24 hours. Beyond 24h, the missed day calcifies as `empty`.

If the user has 0 remaining for the current month, the prompt does not appear.

### Visual

A frozen seal renders with a dashed vermillion border + a 「凍」 corner glyph instead of the `✓` hanko. The streak count proceeds across it.

### Acceptance

- A Pro user who misses one day, then opens the app the next day, sees the freeze prompt and can apply it in one tap. The streak in the today-card and the achievements (`streak_7` etc) reflect the unbroken count.
- A free user never sees the prompt, regardless of state.

---

## 11. Streak unification — retire `<StreakBadge />`

- Remove `<StreakBadge />` import and render from `components/Masthead.tsx`. The masthead's right cluster becomes `[user avatar | nav]` only.
- Delete `components/StreakBadge.tsx`. Anything that imported it is updated to read the streak from the unified compute (server-rendered into `<TodayCard />` for the home page; computed client-side from the same `/api/seal/year` payload elsewhere if needed).
- `lib/achievements.ts::dailyStreakLength` is replaced by a call to the same unified streak helper, which now considers freezes.

### Acceptance

- The masthead no longer shows a streak number.
- The today-card on the home page shows the unified streak inclusive of freezes.
- Achievements `streak_7 / streak_30 / streak_100` correctly trigger when freezes bridge a missed day.

---

## Files touched (reference)

- `lib/kanji-bank.ts` — new. Curated bank of kanji entries.
- `lib/seal/today.ts` — new. Server helper: today's kanji + Sensei line generation, with cache.
- `lib/seal/year.ts` — new. Server helper: assemble a user's 365-day series.
- `lib/seal/streak.ts` — new. Unified streak calc using `daily_results` ∪ `streak_freezes`.
- `lib/achievements.ts` — refactor `dailyStreakLength` to use `lib/seal/streak.ts`.
- `app/api/seal/today/route.ts` — new.
- `app/api/seal/year/route.ts` — new.
- `app/api/share/seal/[date]/route.ts` — new (PNG via @vercel/og).
- `app/api/seal/freeze/route.ts` — new (POST: apply freeze).
- `app/page.tsx` — restructure home around `<TodayCard />` + `<YearScroll />`.
- `components/year-scroll/YearScroll.tsx` — new.
- `components/year-scroll/Seal.tsx` — new.
- `components/year-scroll/SealPopover.tsx` — new (past-day tap).
- `components/year-scroll/TodayCard.tsx` — new.
- `components/year-scroll/ScrollContextStrip.tsx` — new (used in WinModal).
- `components/game/WinModal.tsx` — kanji-bloom + scroll-context strip.
- `components/Masthead.tsx` — drop streak badge.
- `components/StreakBadge.tsx` — delete.
- `supabase/migrations/0004_daily_seal_calendar.sql` — new table.
- `supabase/migrations/0005_streak_freezes.sql` — new table.
- `scripts/seed-seal-calendar.ts` — new.

## Testing

- Unit (vitest):
  - `lib/seal/streak.ts` — streak with no freezes, with freezes bridging gaps, freezes used > allotment, free user with freeze rows in DB (should not happen, but defensive).
  - `lib/seal/year.ts` — series assembly with mixed states across year boundaries.
  - `lib/seal/today.ts` — Sensei line cache hits, regeneration on cache miss, prompt-shape constraints (≤14 words).
- Integration (vitest + supabase test client):
  - Apply freeze within 24h of missed date — succeeds, streak rejoins.
  - Apply freeze beyond 24h — rejected.
  - Free user attempts freeze API — 403.
  - Pro user with 0 remaining — 403.
- Manual:
  - 390 / 768 / 1280+ viewports — home with today-card + scroll, win modal, share image.
  - Reduced motion — pulse and bloom animations downgrade gracefully.
  - Cold session, first-ever play — no scroll history, today's hero renders cleanly.

## Risks

- **Sensei line latency.** A first-load hit waiting on Claude Haiku could delay the today-card's text. Mitigate by rendering the today-card immediately with the eyebrow + kanji + CTA, and progressively revealing the Sensei line as it arrives (skeleton → fade-in). If generation fails, the line is omitted silently.
- **Sensei line quality variance.** Generated text occasionally lands flat. The system prompt constrains tone but cannot guarantee. We accept this in v1; if quality becomes a real problem, add a fallback bank of pre-curated lines per kanji.
- **Calendar exhaustion.** If the deploy script fails, the calendar runs out and the home page degrades. Add a CI check that the calendar has ≥30 days populated ahead of `now()`.
- **Pro freeze churn.** Some free users may bounce off the "0 remaining" message. The prompt only renders for Pro users (free users see no prompt at all), so this is a non-issue for free, but it does subtly upsell Pro on every missed day for free users — we explicitly choose not to show the prompt to free users to avoid that pressure.
- **Streak re-computation cost.** Walking every prior date for streak length is fine for a yearly horizon (max 365 lookups), but verify the SQL `compute_unified_streak` function uses the existing `daily_results_date_time_idx` index efficiently.
- **StreakBadge retirement timing.** Other surfaces may import `<StreakBadge />`. Verify all callers before deletion (rip-and-replace, type system catches it).

## Open questions

1. **Mid-game UTC rollover.** If a user is mid-puzzle when UTC rolls over to a new date, the seal-stamp must point to the date the puzzle was *generated for*, not the date the modal opens. Verify the existing daily flow already binds the completion to `daily_date` (it appears to from `games.daily_date` in the schema, but confirm during implementation).
2. **Reduced-motion fallback for kanji-bloom.** Spec calls for `prefers-reduced-motion` on the pulse animation. The kanji-bloom + corner-press should also degrade — proposed: bloom collapses to an instant render at `t = 0`, corner mark fades in at `t = 100ms` without rotation. Confirm during implementation review.
