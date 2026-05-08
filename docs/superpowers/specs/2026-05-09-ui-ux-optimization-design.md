# Hako UI/UX Optimization — Design

**Date:** 2026-05-09
**Status:** approved (ready for implementation plan)
**Scope:** Mobile-first responsive pass + targeted polish across all public surfaces. Preserve the existing paper-and-ink Hako aesthetic.

## Goals

1. **Mobile / touch UX** — make the app feel native on phones, especially the game.
2. **Friction & speed** — reduce clicks, give moments time to breathe, improve perceived smoothness.
3. **Visual polish & hierarchy** — fix small but visible quirks (alerts, focus rings, type scale).

## Non-goals

- No dark mode. Paper aesthetic is daylight-only.
- No backend caching of ledger/stats. Deferred to a separate performance pass.
- No new accessibility audit beyond focus rings.
- No structural redesign of Pro / Leaderboard / Stats layouts (only typography clamps).
- No change to the game logic, scoring, or persistence behavior.

---

## 1. Game shell — mobile layout

The single biggest current friction. `components/game/GameShell.tsx` uses `grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]`. Below the `lg` breakpoint the layout collapses, but the right rail (NumberPad + Sensei) ends up below the board, so every digit tap forces a scroll.

### Layout rules

- `< lg`: single column. Board capped to `min(100vw - 24px, 520px)` so it stays square and never pushes the masthead off-screen.
- `≥ lg`: layout unchanged.

### NumberPad — fixed bottom rail (mobile)

- On `< lg`, NumberPad is `fixed bottom-0 left-0 right-0 z-20` against `hsl(var(--bone))` with a top border `1.5px solid hsl(var(--sumi))`.
- Vertical structure (top to bottom):
  - Action row: `undo / notes / erase / pause` — 4 buttons, equal width, ~44px tall.
  - Digit row: `1-9` in a single 9-column strip, each square ~44px tall, sized for thumb reach.
- Apply `padding-bottom: env(safe-area-inset-bottom)` for iOS home-indicator clearance.
- `≥ lg`: NumberPad keeps its current 3×3 grid + action grid in the right rail. No structural change.
- Component change: `NumberPad.tsx` accepts no new props. The `<aside>` wrapper in `GameShell.tsx` becomes responsive — `lg:static` (default) vs. mobile uses a wrapping `<div className="lg:hidden fixed ..." />` for the rail and `<div className="hidden lg:block">` for the desktop rail.
- Implementation choice: render the same `<NumberPad />` instance in both wrappers, gated by Tailwind classes. Slightly heavier DOM but avoids fragile state duplication.

### Board breathing room

- Add `pb-[160px] lg:pb-0` to the center column on the game shell so the bottom rail doesn't overlap the last row of cells when the board is scrolled to.

### Sensei — collapsible bottom sheet (mobile)

- Add a small "ask sensei" trigger button to the masthead game variant (right side, before avatar). Mono micro-label, vermillion 師 stamp icon.
- On `< lg`, tapping opens a full-width drawer that slides up from the bottom of the screen, overlaying the NumberPad rail while open (rail returns when the drawer closes). Drawer height ~60vh, with a top handle and close `×` button. Background `hsl(var(--sumi))`, content matches existing `CoachPopover` body.
- On `≥ lg`, the right rail Sensei panel is unchanged. The trigger button only renders on mobile.
- Implementation: extract the body of `CoachPopover.tsx` into a presentational `<SenseiBody />` component. `CoachPopover` becomes a wrapper that renders `<SenseiBody />` directly on desktop and a Radix `Dialog` (full-width drawer styling) containing `<SenseiBody />` on mobile.
- The drawer respects `env(safe-area-inset-bottom)` and closes on `Escape` or backdrop tap.

### Acceptance

- On a 390px-wide viewport, the user can tap a cell and place a digit without any scrolling.
- The bottom rail does not overlap the bottom edge of the board on any viewport ≥ 320px wide.
- The Sensei drawer can be opened, used, and dismissed without scrolling away from the board.

---

## 2. Masthead — mobile nav

Currently the default masthead has nav links `hidden md:flex` with no replacement on smaller screens.

### Default variant

- Add a hamburger trigger on the left, between the stamp/name and the (now hidden) nav. Visible only `< md`.
- Tap opens a full-screen overlay (background `hsl(var(--bone))`, opens with a 180ms ease-out fade + 8px slide).
- Overlay contents: large mincho stacked links (Today / Casual / Ledger / Stats / Pro), each ~28px, separated by hairline `hsla(sumi/0.12)` rules. Active item gets a vermillion underline.
- Close on tap of any link, on backdrop, on `Escape`.
- Body scroll-lock while open.

### Game variant

- Keep timer + solved + avatar.
- Add the "ask sensei" trigger button (see §1) on `< lg` between solved-count and avatar.
- On `< sm`: hide the literal "solved" eyebrow label, keep only the `{filled}/{total}` number; reduce timer to `text-xl` from `text-2xl`.

### Acceptance

- On a 390px-wide viewport, every page is navigable without typing URLs.
- The mobile menu can be opened and closed by keyboard alone.

---

## 3. WinModal — breathing room + seal-burst origin

`components/game/WinModal.tsx` opens immediately on `isComplete`. The player misses the moment of placing their last digit.

- Defer modal open by **700ms** after `isComplete` flips. Use a `setTimeout` inside the existing `useEffect` and clear it on unmount or if `isComplete` flips back.
- Refactor `SealBurst`: rays currently emit from a hard-coded `top: 140px` that doesn't track the actual seal position. Wrap the seal element + burst in a relatively-positioned container; render burst rays absolutely-centered (`left: 50%; top: 50%; translate: -50% -50%`) inside that container so the burst origin = seal center on any screen size.
- Add a soft vermillion radial wash *behind* the seal: `radial-gradient(closest-side, hsla(var(--vermillion)/0.18), transparent)`, fades in over 200ms simultaneously with the burst.
- Animation timeline (relative to `t = 0` when the modal opens):
  - 0–200ms: backdrop + dialog frame fade in.
  - 100–400ms: seal scales from 0 to 1 with the existing spring.
  - 100–300ms: vermillion wash fades in.
  - 100–900ms: burst rays animate outward (existing animation).
  - 400ms+: stats + buttons fade in (~150ms).

### Acceptance

- After completing the puzzle, there is a noticeable beat before the modal opens.
- Burst rays visually emit from the seal regardless of viewport.

---

## 4. AuthForm — replace native `alert()`

`components/auth/AuthForm.tsx` calls `alert("Check your email for the magic link.")`. Native browser modal breaks the aesthetic and can re-fire.

- Remove the `alert()` call.
- Replace the form (`button` + `input`) with an inline confirmation panel after a successful magic-link request:
  - Vermillion `✓` glyph (mincho) on the left.
  - Mincho heading: "Check your email."
  - Cormorant italic body: "Magic link sent to {email}. The link works once and expires in 10 minutes."
  - Small mono "use a different email" link to reset.
- Visually replaces the form (no `display: none` flicker — controlled by a `submitted` state).
- Toaster is *not* used here (per design — toaster is for ambient feedback; this is a form state transition).

### Acceptance

- After submitting, no native browser alert appears.
- The user sees a clear, on-brand confirmation and can retry with a different email.

---

## 5. Focus-visible ring system

Currently no global `:focus-visible` style. Keyboard users see browser defaults (or nothing).

- Add to `app/globals.css` under `@layer base`:
  ```css
  *:focus-visible {
    outline: 2px solid hsl(var(--vermillion));
    outline-offset: 2px;
  }
  ```
- For grid cells (`.hako-cell`), `outline` would be clipped by neighbor borders. Add a more-specific override:
  ```css
  .hako-cell:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px hsl(var(--vermillion));
  }
  ```
- For inputs in `AuthForm`, the existing `focus:bg-paper` already serves visual feedback; the global outline complements it.

### Acceptance

- Tabbing through the home page, login form, and game shell shows visible vermillion rings on every interactive element.

---

## 6. Coach streaming cursor

`CoachPopover.tsx` (and the renamed `SenseiBody`) shows streaming text without a cursor — chunks just appear.

- While `streaming === true`, append a blinking vermillion `▊` glyph after the rendered text.
- Use a CSS keyframe `@keyframes hako-blink { 50% { opacity: 0; } }` with `animation: hako-blink 1s steps(1) infinite`.
- Remove the cursor when streaming completes.

### Acceptance

- During a streaming response, a single blinking cursor is visible at the end of the text.
- After streaming, the cursor disappears.

---

## 7. NumberPad "remaining" badge

The `·{remaining}` badge in `NumberPad.tsx` is 9px and easy to miss.

- Drop the leading `·`. Show just the digit.
- Increase to 10px, keep mono, keep `top: 5px; right: 7px`.
- When `remaining <= 2 && remaining > 0`: badge becomes `text-vermillion font-semibold`. (Tells the player a digit is near-exhausted — useful pacing signal.)
- When `remaining === 0`: badge is hidden (the `.done` class already greys the digit).
- Implementation: the `.ct` class in `globals.css` gets a sibling `.ct.warn` style; the JSX conditionally adds `.warn`.

### Acceptance

- The remaining count is readable at a glance.
- A digit with 1 or 2 left looks visibly "warm" without being alarming.

---

## 8. Typography & spacing clamps

Fixed-step font sizes overflow narrow viewports. Replace with fluid `clamp()`.

- Home (`app/page.tsx`):
  - h1 `text-[68px] sm:text-[88px] lg:text-[108px]` → `text-[clamp(48px,12vw,108px)]`.
- Stats (`app/stats/page.tsx`):
  - h1 `text-[42px] sm:text-[54px]` → `text-[clamp(36px,7vw,54px)]`.
- Login (`app/auth/login/page.tsx`):
  - h2 `text-[64px] sm:text-[80px] lg:text-[96px]` → `text-[clamp(44px,11vw,96px)]`.
- Pro (`app/pro/page.tsx`):
  - h2 `text-[64px] md:text-[80px]` → `text-[clamp(48px,10vw,80px)]`.
- Home "global pace" stats row: replace vertical-only `border-l` separators with `flex-wrap gap-x-8 gap-y-4` (no dividers between wrapped rows). Above-mobile layout unchanged visually.

### Acceptance

- Headings never overflow the viewport on any device down to 320px wide.
- "Global pace" rows wrap cleanly on narrow phones.

---

## 9. Home & stats — minor

- Home (`app/page.tsx`): add a small vermillion `↘` glyph before the "your name lands when you finish." line, mincho italic, ~12px. Keeps the line's mood, gives it a visual anchor.
- Stats (`app/stats/page.tsx`): wrap the heatmap container in `overflow-x-auto -mx-7 px-7 lg:mx-0 lg:px-0` so the heatmap can horizontally scroll on `< md` instead of overflowing.

### Acceptance

- The home leaderboard preview line has a clear visual marker.
- The stats heatmap doesn't horizontally overflow on mobile.

---

## Files touched (reference)

- `app/globals.css` — focus-visible rules, blink keyframe, badge `.warn` class.
- `app/page.tsx` — typography clamps, "global pace" wrap fix, ledger preview anchor glyph.
- `app/stats/page.tsx` — typography clamp, heatmap overflow wrapper.
- `app/auth/login/page.tsx` — typography clamp.
- `app/pro/page.tsx` — typography clamp.
- `components/Masthead.tsx` — mobile hamburger + overlay (default variant), sensei trigger + game variant compaction.
- `components/game/GameShell.tsx` — mobile bottom rail wrapper, board padding-bottom, sensei drawer integration.
- `components/game/NumberPad.tsx` — mobile-rail layout variant, badge tweaks.
- `components/game/CoachPopover.tsx` — split into `SenseiBody` + responsive wrapper, streaming cursor.
- `components/game/WinModal.tsx` — defer-open timing, SealBurst origin refactor, vermillion wash.
- `components/auth/AuthForm.tsx` — replace `alert()` with inline confirmation.

## Testing

- Manual on three viewports: 390 (iPhone), 768 (iPad portrait), 1280+ (desktop).
- Keyboard-only navigation pass on home, login, game.
- Verify the magic-link inline confirmation by submitting the form on a real device.
- Verify the bottom rail clears the iOS home indicator on a notched phone (or simulator).
- Verify the WinModal delay does not break the existing daily-submit flow (the modal still gates submission; the delay is purely visual).

## Risks

- **Bottom rail overlap:** if the board is scrolled, the fixed rail could obscure cells. Mitigated by the `pb-[160px]` on the center column and capped board size.
- **Drawer / dialog conflict:** opening the Sensei drawer over a game in progress could trap focus; ensure `Escape` always closes and that focus returns to the trigger.
- **Hydration of new responsive components:** the NumberPad rendered in two places must read the same Zustand store; verify both subscribe correctly. (Zustand handles this fine, but worth watching.)
- **Win modal delay vs. confetti / burst:** the existing `framer-motion` animations key off `isComplete`. Verify the 700ms delay doesn't desync the burst with the modal open.
