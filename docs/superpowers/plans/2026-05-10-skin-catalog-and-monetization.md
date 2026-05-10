# Skin Catalog & Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the skin engine shipped in Plan 1 into a real product surface — a `/skins` catalog (back-issues rack), a one-off Stripe checkout for premium skins, a refreshed Pro page bullet, and a Pro-only picker chip in the masthead that lets Pro users override their home/casual chrome.

**Architecture:** Catalog page reads all `active = true` skins via the existing world-readable RLS policy, joins them against the viewer's entitlements + Pro flag, and renders one of six action states per skin (pure helper, testable). One-off purchases go through a new `/api/stripe/checkout/skin` endpoint that mirrors the Pro subscription pattern but in `mode: "payment"` and looks up the per-skin Stripe price ID via env var lookup keyed on slug. The picker chip is a server-resolved component rendered as an opt-in slot on `Masthead`; it returns `null` for free users so they never see the control. Override writes go through a new server action that re-runs `canApplyOverride` server-side before touching `profiles.active_skin_id`.

**Tech Stack:** Next.js 14 (App Router, server actions), TypeScript, Supabase (Postgres + RLS), Stripe SDK (`mode: "payment"` for one-offs), Tailwind, vitest, Radix dialog/popover primitives already in `components/ui/*`.

**Spec:** `docs/superpowers/specs/2026-05-09-volumes-skins-vfx-design.md` (sections: "Skin catalog", "Pro page", "Stripe checkout endpoints", "Monetization")

**Predecessor plan:** `docs/superpowers/plans/2026-05-09-skin-engine-and-casual.md` (Plan 1 — shipped via PR #8)

**Out of scope for this plan (deferred):**
- VFX/SFX layer — placement ink, solve ceremony, sound toggle (Plan 3)
- Stripe webhook completion — pre-existing TODO in the Pro flow; this plan inherits the manual SQL fallback for both Pro and skins (`insert into user_skin_entitlements ...`)
- Skin gifting flow — `source = "gift"` value is reserved in the schema but no UI ships in this plan
- Per-skin audio packs (`audio_pack` column not added)
- A/B testing of skin pricing — single price per skin, tunable later
- Skin admin UI — premium skins are seeded via `scripts/seed-skins.ts`; managing them stays a developer task
- Dedicated past-volume archive UI (magazine-rack browser) — not this plan

---

## File Structure

**New files:**
- `app/skins/page.tsx` — catalog page; two sections (seasonal volumes, premium editions); renders action per skin
- `app/api/stripe/checkout/skin/route.ts` — POST endpoint for one-off skin purchase, mode: "payment"
- `app/actions/skins.ts` — server action `setActiveSkin(skinId | null)`; runs `canApplyOverride` server-side
- `lib/stripe/skin-prices.ts` — pure helper `getPriceIdForSkinSlug(slug) -> string | null`
- `lib/skins/catalog.ts` — pure helper `getCatalogAction(skin, viewer, today) -> CatalogAction`; state machine for the per-skin button
- `lib/skins/viewer.ts` — server-only `getViewer()` returns `{ userId, isPro, activeSkinId, ownedSkinIds, allSkins }` (used by catalog page + picker chip; replaces inline duplication of the resolver's data fetch)
- `components/skins/SkinChip.tsx` — server component; renders nothing for free users; otherwise renders `<SkinPicker viewer={viewer} />`
- `components/skins/SkinPicker.tsx` — client component; popover with the user's wearable skins; calls `setActiveSkin`
- `components/skins/SkinCard.tsx` — client component for a single catalog row; takes `action: CatalogAction`; renders the appropriate button/form
- `tests/skins/catalog.test.ts` — pure-logic tests for `getCatalogAction`
- `tests/stripe/skin-prices.test.ts` — pure-logic tests for `getPriceIdForSkinSlug`
- `tests/actions/setActiveSkin.test.ts` — integration-shape test for the server action (auth + entitlement gate); mocks Supabase

**Modified files:**
- `app/pro/page.tsx:92-101` — swap third bullet (`No ads, ever`) for `The full skin library` (still three bullets total — replacement, not append)
- `components/Masthead.tsx` — add optional `rightChip?: React.ReactNode` prop, render between nav and avatar in default variant
- `app/page.tsx` — render `<SkinChip />` as `rightChip` on signed-in masthead
- `app/play/page.tsx` — same `<SkinChip />` slot
- `app/skins/page.tsx` — same (so catalog page is consistent with home)
- `lib/skins/server.ts` — refactor `resolveActiveSkinServer` to optionally accept a pre-fetched viewer to avoid double-fetch with `getViewer()`
- `app/layout.tsx` — call `getViewer()` once, pass to `resolveActiveSkinServer`

**Env vars added (must be set on Vercel preview + prod before merge):**
- `STRIPE_PRICE_ID_SKIN_SUMI` — Stripe one-off price ID for sumi-e ($3.00)
- `STRIPE_PRICE_ID_SKIN_INDIGO` — Stripe one-off price ID for indigo ($3.00)

---

## Phase 1 — Pro page copy refresh

The smallest change, lowest risk, fastest first commit. Ships independently of the rest.

### Task 1: Replace the "No ads, ever" bullet

**Files:**
- Modify: `app/pro/page.tsx:92-101`

- [ ] **Step 1: Read the current bullet block**

Confirm the current third bullet is at lines 92–101:

```tsx
<li className="pro-bn last">
  <div className="pro-bk">完</div>
  <div>
    <div className="pro-bt">No ads, ever.</div>
    <div className="pro-bd">
      No interstitials between puzzles. The seal stays clean.
    </div>
  </div>
</li>
```

- [ ] **Step 2: Replace with the skin-library bullet**

Use Edit to replace the inner `pro-bt` and `pro-bd` divs only — keep the `<li>` wrapper, kanji glyph, and `last` class:

```tsx
<li className="pro-bn last">
  <div className="pro-bk">完</div>
  <div>
    <div className="pro-bt">The full skin library.</div>
    <div className="pro-bd">
      Every season skin, every premium edition. Yours while you&rsquo;re a member;
      one-off purchases stay yours forever.
    </div>
  </div>
</li>
```

The `完` glyph is reused by deliberate brand choice (the seal). Spec section "Pro page" line 232 specifies this exact copy.

- [ ] **Step 3: Verify the page renders**

Run: `npm run dev`
Open: `http://localhost:3000/pro` (signed out — the page redirects auth, so use a fresh incognito or sign out first; or if you have a dev account that's not Pro, just visit `/pro`).
Expected: three bullets render (coach unlimited / expert+archive / full skin library), no layout shift, kanji glyphs are 先 / 極 / 完.

- [ ] **Step 4: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/pro/page.tsx
git commit -m "refactor(pro): swap 'No ads' bullet for 'The full skin library'"
```

---

## Phase 2 — One-off skin checkout endpoint

The Stripe primitive that powers "Buy · \$3" buttons in the catalog.

### Task 2: Pure helper `getPriceIdForSkinSlug`

**Files:**
- Create: `lib/stripe/skin-prices.ts`
- Create: `tests/stripe/skin-prices.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/stripe/skin-prices.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPriceIdForSkinSlug } from "@/lib/stripe/skin-prices";

describe("getPriceIdForSkinSlug", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.STRIPE_PRICE_ID_SKIN_SUMI = "price_test_sumi";
    process.env.STRIPE_PRICE_ID_SKIN_INDIGO = "price_test_indigo";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns the env price id for sumi-e", () => {
    expect(getPriceIdForSkinSlug("sumi-e")).toBe("price_test_sumi");
  });

  it("returns the env price id for indigo", () => {
    expect(getPriceIdForSkinSlug("indigo")).toBe("price_test_indigo");
  });

  it("returns null for an unmapped slug", () => {
    expect(getPriceIdForSkinSlug("spring-2026")).toBeNull();
    expect(getPriceIdForSkinSlug("default")).toBeNull();
    expect(getPriceIdForSkinSlug("nonexistent")).toBeNull();
  });

  it("returns null when the env var is unset", () => {
    delete process.env.STRIPE_PRICE_ID_SKIN_SUMI;
    expect(getPriceIdForSkinSlug("sumi-e")).toBeNull();
  });

  it("returns null when the env var is empty string", () => {
    process.env.STRIPE_PRICE_ID_SKIN_SUMI = "";
    expect(getPriceIdForSkinSlug("sumi-e")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- skin-prices`
Expected: FAIL with "module not found" or similar.

- [ ] **Step 3: Implement the helper**

```ts
// lib/stripe/skin-prices.ts

const SLUG_TO_ENV: Record<string, string> = {
  "sumi-e": "STRIPE_PRICE_ID_SKIN_SUMI",
  "indigo": "STRIPE_PRICE_ID_SKIN_INDIGO",
};

export function getPriceIdForSkinSlug(slug: string): string | null {
  const envKey = SLUG_TO_ENV[slug];
  if (!envKey) return null;
  const value = process.env[envKey];
  return value && value.length > 0 ? value : null;
}

export function isPurchasableSlug(slug: string): boolean {
  return slug in SLUG_TO_ENV;
}
```

`isPurchasableSlug` is a tiny convenience for the catalog and the endpoint to validate the slug before calling Stripe; it lets us return a 400 instead of leaking that an env var is missing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- skin-prices`
Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/stripe/skin-prices.ts tests/stripe/skin-prices.test.ts
git commit -m "feat(stripe): per-skin Stripe price ID lookup"
```

---

### Task 3: Stripe checkout endpoint for one-off skin purchase

**Files:**
- Create: `app/api/stripe/checkout/skin/route.ts`

- [ ] **Step 1: Implement the endpoint**

```ts
// app/api/stripe/checkout/skin/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getPriceIdForSkinSlug, isPurchasableSlug } from "@/lib/stripe/skin-prices";

export async function POST(req: Request) {
  const sb = createServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_SITE_URL!));
  }

  // Form-encoded body: { slug: "sumi-e" }
  // We accept slug rather than skin_id so the form action is stable across DB resets.
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "");

  if (!isPurchasableSlug(slug)) {
    return NextResponse.json({ error: "skin not purchasable" }, { status: 400 });
  }

  const priceId = getPriceIdForSkinSlug(slug);
  if (!priceId) {
    // Slug is in the allow-list but the env var is unset — config error, not user error.
    console.error(`[stripe/checkout/skin] missing price id for slug=${slug}`);
    return NextResponse.json({ error: "checkout temporarily unavailable" }, { status: 503 });
  }

  // Look up skin_id for the metadata so the (future) webhook can insert
  // user_skin_entitlements directly without a slug→id round-trip.
  const { data: skin } = await sb
    .from("skins")
    .select("id")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!skin) {
    return NextResponse.json({ error: "skin not found" }, { status: 404 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/skins?purchased=${encodeURIComponent(slug)}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/skins?canceled=1`,
    customer_email: user.email,
    metadata: { user_id: user.id, skin_id: skin.id, skin_slug: slug },
  });
  // TODO(stripe): implement webhook to insert user_skin_entitlements row on
  // `checkout.session.completed`. For prototype, manually run in Supabase SQL editor:
  //   insert into user_skin_entitlements (user_id, skin_id, source)
  //   values ('<user-uuid>', '<skin-uuid>', 'purchase');
  return NextResponse.redirect(session.url!, { status: 303 });
}
```

- [ ] **Step 2: Document the new env vars**

Add to `README.md` under the env-vars / setup section (or wherever Pro env vars are documented). If there's no env doc, create `.env.example` with all required vars copied from the existing project. Search first:

```bash
grep -rn "STRIPE_PRICE_ID_PRO" --include="*.md"
```

If a doc lists `STRIPE_PRICE_ID_PRO`, add the two new vars adjacent to it with this comment:

```
# One-off skin price IDs (Stripe, mode: payment).
# Values come from the Stripe dashboard → Products → <skin name> → Pricing.
STRIPE_PRICE_ID_SKIN_SUMI=price_xxxxxxxxxxxxxx
STRIPE_PRICE_ID_SKIN_INDIGO=price_xxxxxxxxxxxxxx
```

If there's no env documentation file at all, skip this step but note it in the PR description so the repo owner can set the vars on Vercel.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
With Stripe test mode keys set in `.env.local` and the two new price IDs filled in:

```bash
curl -X POST http://localhost:3000/api/stripe/checkout/skin \
  -d "slug=sumi-e" \
  -H "Cookie: <copy your sb-* cookies from devtools>" \
  -i
```

Expected: 303 redirect to a Stripe `checkout.stripe.com/...` URL. Visiting that URL in a browser should land on Stripe's checkout page priced at $3.00.

If you don't have Stripe test mode set up, skip the live test — verify only that:
1. POST without `slug` returns 400.
2. POST with `slug=spring-2026` returns 400 (not purchasable).
3. POST with `slug=sumi-e` but missing `STRIPE_PRICE_ID_SKIN_SUMI` returns 503.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/stripe/checkout/skin/route.ts README.md
git commit -m "feat(stripe): one-off skin checkout endpoint (POST /api/stripe/checkout/skin)"
```

(If `README.md` wasn't modified, drop it from `git add`.)

---

## Phase 3 — Catalog action helper + viewer fetch

The pure logic that decides what button each catalog row shows.

### Task 4: Server-only viewer fetcher

**Files:**
- Create: `lib/skins/viewer.ts`

This consolidates the data the catalog page, the picker chip, and the layout all need. `resolveActiveSkinServer` already fetches most of this — the duplication is the price of keeping it self-contained. We accept the duplication for now and (in Task 5) thread the viewer through `resolveActiveSkinServer` to avoid a double-fetch when both run on the same request.

- [ ] **Step 1: Implement `getViewer`**

```ts
// lib/skins/viewer.ts
import { createServerClient } from "@/lib/supabase/server";
import type { SkinRecord } from "./types";

export interface Viewer {
  userId: string | null;
  isPro: boolean;
  activeSkinId: string | null;
  ownedSkinIds: Set<string>;
  allSkins: SkinRecord[];
}

const EMPTY_VIEWER: Viewer = {
  userId: null,
  isPro: false,
  activeSkinId: null,
  ownedSkinIds: new Set(),
  allSkins: [],
};

export async function getViewer(): Promise<Viewer> {
  const sb = createServerClient();

  const logQueryError = (where: string, error: unknown) => {
    if (error) console.error(`[skins/viewer] ${where}:`, error);
  };

  const { data: skinsRaw, error: skinsError } = await sb
    .from("skins")
    .select(
      "id,slug,kind,name,kanji_label,seal_kanji,palette_key,masthead,start_date,end_date,price_cents,active",
    )
    .eq("active", true);
  logQueryError("skins.select", skinsError);
  const allSkins: SkinRecord[] = (skinsRaw ?? []) as unknown as SkinRecord[];

  const {
    data: { user },
    error: userError,
  } = await sb.auth.getUser();
  logQueryError("auth.getUser", userError);

  if (!user) {
    return { ...EMPTY_VIEWER, allSkins };
  }

  const [
    { data: profile, error: profileError },
    { data: ents, error: entsError },
  ] = await Promise.all([
    sb.from("profiles").select("active_skin_id,is_pro").eq("id", user.id).maybeSingle(),
    sb.from("user_skin_entitlements").select("skin_id").eq("user_id", user.id),
  ]);
  logQueryError("profiles.select", profileError);
  logQueryError("user_skin_entitlements.select", entsError);

  return {
    userId: user.id,
    isPro: profile?.is_pro ?? false,
    activeSkinId: profile?.active_skin_id ?? null,
    ownedSkinIds: new Set((ents ?? []).map((e: { skin_id: string }) => e.skin_id)),
    allSkins,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/skins/viewer.ts
git commit -m "feat(skins): getViewer() server-side fetch for catalog + picker"
```

---

### Task 5: Refactor `resolveActiveSkinServer` to accept a pre-fetched viewer

**Files:**
- Modify: `lib/skins/server.ts`

This avoids the catalog page (which calls `getViewer()`) and the layout (which calls `resolveActiveSkinServer()`) double-fetching the same skins/profile/entitlements rows on the same request.

- [ ] **Step 1: Update the signature and body**

Replace the current `resolveActiveSkinServer` with this version that accepts an optional viewer:

```ts
// lib/skins/server.ts
import { createServerClient } from "@/lib/supabase/server";
import { resolveActiveSkin } from "./resolve";
import type { SkinResolved, Surface } from "./types";
import { getViewer, type Viewer } from "./viewer";

interface ResolveServerArgs {
  surface: Surface;
  dailyDate?: string;        // YYYY-MM-DD when surface === "daily"
  viewer?: Viewer;           // pre-fetched on the same request to avoid double-fetch
}

export async function resolveActiveSkinServer(args: ResolveServerArgs): Promise<SkinResolved> {
  const today = new Date().toISOString().slice(0, 10);
  const viewer = args.viewer ?? (await getViewer());

  // For daily surface, look up the daily's skin_id.
  let dailySkinId: string | null = null;
  if (args.surface === "daily" && args.dailyDate) {
    const sb = createServerClient();
    const { data: daily, error: dailyError } = await sb
      .from("daily_puzzles")
      .select("skin_id")
      .eq("date", args.dailyDate)
      .maybeSingle();
    if (dailyError) console.error("[skins/server] daily_puzzles.select:", dailyError);
    dailySkinId = daily?.skin_id ?? null;
  }

  return resolveActiveSkin({
    surface: args.surface,
    activeSkinId: viewer.activeSkinId,
    isPro: viewer.isPro,
    ownedSkinIds: viewer.ownedSkinIds,
    dailySkinId,
    today,
    skins: viewer.allSkins,
  });
}
```

- [ ] **Step 2: Update `app/layout.tsx` to fetch viewer once**

```tsx
// app/layout.tsx — modify the RootLayout body
import { getViewer } from "@/lib/skins/viewer";
import { resolveActiveSkinServer } from "@/lib/skins/server";
// ...other imports unchanged...

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const skin = await resolveActiveSkinServer({ surface: "home", viewer });

  return (
    <html
      lang="en"
      className={`${mincho.variable} ${jakarta.variable} ${mono.variable} ${cormorant.variable}`}
    >
      <body data-skin={skin.paletteKey}>
        <SkinProvider skin={skin}>
          {children}
          <Toaster />
        </SkinProvider>
      </body>
    </html>
  );
}
```

(Replace the existing `RootLayout` function body with this; keep `metadata`, `viewport`, font setup unchanged.)

- [ ] **Step 3: Verify existing call sites still work**

Search for other callers:

```bash
grep -rn "resolveActiveSkinServer" --include="*.ts" --include="*.tsx"
```

Expected: callers in `app/play/daily/page.tsx`, `app/play/[difficulty]/page.tsx`, and `app/layout.tsx`. The signature change is backward-compatible (`viewer` is optional). No other call sites need changes.

- [ ] **Step 4: Typecheck and run existing tests**

Run: `npm run typecheck && npm run test`
Expected: 92/92 tests pass (Plan 1's count). No new tests yet.

- [ ] **Step 5: Commit**

```bash
git add lib/skins/server.ts app/layout.tsx
git commit -m "refactor(skins): resolveActiveSkinServer accepts pre-fetched viewer"
```

---

### Task 6: Pure catalog action helper

**Files:**
- Create: `lib/skins/catalog.ts`
- Create: `tests/skins/catalog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/skins/catalog.test.ts
import { describe, it, expect } from "vitest";
import { getCatalogAction } from "@/lib/skins/catalog";
import type { SkinRecord } from "@/lib/skins/types";
import type { Viewer } from "@/lib/skins/viewer";

const skin = (overrides: Partial<SkinRecord>): SkinRecord => ({
  id: "skin-id",
  slug: "test-skin",
  kind: "premium",
  name: "Test Skin",
  kanji_label: "試",
  seal_kanji: "試",
  palette_key: "test",
  masthead: "Today's test.",
  start_date: null,
  end_date: null,
  price_cents: 300,
  active: true,
  ...overrides,
});

const viewer = (overrides: Partial<Viewer>): Viewer => ({
  userId: "u1",
  isPro: false,
  activeSkinId: null,
  ownedSkinIds: new Set(),
  allSkins: [],
  ...overrides,
});

const TODAY = "2026-04-15"; // mid-spring

describe("getCatalogAction — premium skins", () => {
  const sumi = skin({ id: "sumi-id", slug: "sumi-e", kind: "premium", name: "Sumi-e", price_cents: 300 });

  it("free user, not owned: shows buy button with price", () => {
    const action = getCatalogAction(sumi, viewer({ isPro: false }), TODAY);
    expect(action).toEqual({ kind: "buy", priceCents: 300, slug: "sumi-e" });
  });

  it("free user, owned via past purchase: shows wear button", () => {
    const action = getCatalogAction(
      sumi,
      viewer({ isPro: false, ownedSkinIds: new Set(["sumi-id"]) }),
      TODAY,
    );
    expect(action).toEqual({ kind: "wear", skinId: "sumi-id" });
  });

  it("Pro user: shows wear button with 'included' caption", () => {
    const action = getCatalogAction(sumi, viewer({ isPro: true }), TODAY);
    expect(action).toEqual({ kind: "wear-included", skinId: "sumi-id" });
  });

  it("any user already wearing it: shows 'wearing now' (with revert)", () => {
    const action = getCatalogAction(
      sumi,
      viewer({ isPro: true, activeSkinId: "sumi-id" }),
      TODAY,
    );
    expect(action).toEqual({ kind: "wearing", skinId: "sumi-id" });
  });

  it("free user with anonymous viewer: shows buy button", () => {
    const action = getCatalogAction(sumi, viewer({ userId: null, isPro: false }), TODAY);
    expect(action).toEqual({ kind: "buy", priceCents: 300, slug: "sumi-e" });
  });
});

describe("getCatalogAction — season skins", () => {
  const spring = skin({
    id: "spring-id",
    slug: "spring-2026",
    kind: "season",
    name: "Spring 2026",
    start_date: "2026-03-01",
    end_date: "2026-05-31",
    price_cents: null,
  });
  const winter = skin({
    id: "winter-id",
    slug: "winter-2026",
    kind: "season",
    name: "Winter 2026",
    start_date: "2026-12-01",
    end_date: "2027-02-28",
    price_cents: null,
  });
  const lastSpring = skin({
    id: "spring-25-id",
    slug: "spring-2025",
    kind: "season",
    name: "Spring 2025",
    start_date: "2025-03-01",
    end_date: "2025-05-31",
    price_cents: null,
  });

  it("current season for free user: shows 'in print now' (no action)", () => {
    const action = getCatalogAction(spring, viewer({ isPro: false }), TODAY);
    expect(action).toEqual({ kind: "in-print", seasonName: "Spring 2026" });
  });

  it("current season for Pro user (not actively overriding to it): shows wear button", () => {
    const action = getCatalogAction(spring, viewer({ isPro: true, activeSkinId: null }), TODAY);
    expect(action).toEqual({ kind: "wear", skinId: "spring-id" });
  });

  it("future season for free user: shows 'coming {date}' lock", () => {
    const action = getCatalogAction(winter, viewer({ isPro: false }), TODAY);
    expect(action).toEqual({ kind: "future", startDate: "2026-12-01", seasonName: "Winter 2026" });
  });

  it("future season for Pro user: also locked (editorial constraint — no time travel)", () => {
    const action = getCatalogAction(winter, viewer({ isPro: true }), TODAY);
    expect(action).toEqual({ kind: "future", startDate: "2026-12-01", seasonName: "Winter 2026" });
  });

  it("past season for Pro user: shows wear button (back issue)", () => {
    const action = getCatalogAction(lastSpring, viewer({ isPro: true }), TODAY);
    expect(action).toEqual({ kind: "wear", skinId: "spring-25-id" });
  });

  it("past season for free user: shows 'from {season}' caption", () => {
    const action = getCatalogAction(lastSpring, viewer({ isPro: false }), TODAY);
    expect(action).toEqual({ kind: "back-issue", seasonName: "Spring 2025" });
  });
});

describe("getCatalogAction — default skin", () => {
  const def = skin({ id: "def-id", slug: "default", kind: "premium", price_cents: null });

  it("default skin is not surfaced (returns hidden)", () => {
    const action = getCatalogAction(def, viewer({ isPro: false }), TODAY);
    expect(action).toEqual({ kind: "hidden" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- catalog`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

```ts
// lib/skins/catalog.ts
import type { SkinRecord } from "./types";
import type { Viewer } from "./viewer";
import { isPurchasableSlug } from "@/lib/stripe/skin-prices";

export type CatalogAction =
  | { kind: "hidden" }
  | { kind: "wearing"; skinId: string }
  | { kind: "wear"; skinId: string }
  | { kind: "wear-included"; skinId: string }
  | { kind: "buy"; slug: string; priceCents: number }
  | { kind: "in-print"; seasonName: string }
  | { kind: "back-issue"; seasonName: string }
  | { kind: "future"; startDate: string; seasonName: string };

export function getCatalogAction(
  skin: SkinRecord,
  viewer: Viewer,
  today: string,
): CatalogAction {
  // Default skin is engine plumbing, not a product surface.
  if (skin.slug === "default") return { kind: "hidden" };

  // Already wearing this skin? Always show "wearing" first so the action exists.
  if (viewer.activeSkinId === skin.id) {
    return { kind: "wearing", skinId: skin.id };
  }

  if (skin.kind === "season") {
    return getSeasonAction(skin, viewer, today);
  }

  // premium / limited path
  if (viewer.isPro) {
    return { kind: "wear-included", skinId: skin.id };
  }
  if (viewer.ownedSkinIds.has(skin.id)) {
    return { kind: "wear", skinId: skin.id };
  }
  if (isPurchasableSlug(skin.slug) && skin.price_cents !== null) {
    return { kind: "buy", slug: skin.slug, priceCents: skin.price_cents };
  }
  // Premium skin without a Stripe price configured — treat as hidden so we
  // don't render a useless "buy" with no env var behind it.
  return { kind: "hidden" };
}

function getSeasonAction(
  skin: SkinRecord,
  viewer: Viewer,
  today: string,
): CatalogAction {
  if (!skin.start_date || !skin.end_date) {
    // Shouldn't happen — DB constraint enforces this — but degrade gracefully.
    return { kind: "hidden" };
  }

  const isFuture = today < skin.start_date;
  const isCurrent = !isFuture && today <= skin.end_date;
  const isPast = today > skin.end_date;

  if (isFuture) {
    return { kind: "future", startDate: skin.start_date, seasonName: skin.name };
  }

  if (isCurrent) {
    if (viewer.isPro) return { kind: "wear", skinId: skin.id };
    return { kind: "in-print", seasonName: skin.name };
  }

  if (isPast) {
    if (viewer.isPro) return { kind: "wear", skinId: skin.id };
    return { kind: "back-issue", seasonName: skin.name };
  }

  return { kind: "hidden" };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- catalog`
Expected: 11/11 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/skins/catalog.ts tests/skins/catalog.test.ts
git commit -m "feat(skins): getCatalogAction state machine for catalog rows"
```

---

## Phase 4 — Override write path (server action)

The write side of `profiles.active_skin_id`. Plan 1 read this column; this task adds the write.

### Task 7: `setActiveSkin` server action

**Files:**
- Create: `app/actions/skins.ts`
- Create: `tests/actions/setActiveSkin.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/actions/setActiveSkin.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActiveSkin } from "@/app/actions/skins";

// Mocks for server modules — vitest hoists `vi.mock` calls before imports.
const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const mockGetViewer = vi.fn();
vi.mock("@/lib/skins/viewer", () => ({
  getViewer: mockGetViewer,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Default chain: from(...).update(...).eq(...) → resolves OK
  mockEq.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockSelect.mockReturnValue({
    eq: () => ({ maybeSingle: mockMaybeSingle }),
  });
  mockFrom.mockImplementation((table: string) => {
    if (table === "profiles") {
      return { update: mockUpdate };
    }
    return { select: mockSelect };
  });
});

describe("setActiveSkin", () => {
  it("rejects unauthenticated callers", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await setActiveSkin("skin-1");
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("clears active_skin_id when called with null (any signed-in user)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const result = await setActiveSkin(null);
    expect(result).toEqual({ ok: true });
    expect(mockUpdate).toHaveBeenCalledWith({ active_skin_id: null });
  });

  it("rejects free user trying to set a season skin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockGetViewer.mockResolvedValue({
      userId: "u1",
      isPro: false,
      activeSkinId: null,
      ownedSkinIds: new Set(),
      allSkins: [
        {
          id: "spring-id",
          slug: "spring-2026",
          kind: "season",
          name: "Spring",
          kanji_label: "春",
          seal_kanji: "桜",
          palette_key: "spring",
          masthead: "",
          start_date: "2026-03-01",
          end_date: "2026-05-31",
          price_cents: null,
          active: true,
        },
      ],
    });

    const result = await setActiveSkin("spring-id");
    expect(result).toEqual({ ok: false, error: "not entitled" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows Pro user to set any active skin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockGetViewer.mockResolvedValue({
      userId: "u1",
      isPro: true,
      activeSkinId: null,
      ownedSkinIds: new Set(),
      allSkins: [
        {
          id: "sumi-id",
          slug: "sumi-e",
          kind: "premium",
          name: "Sumi-e",
          kanji_label: "墨",
          seal_kanji: "墨",
          palette_key: "sumi",
          masthead: "",
          start_date: null,
          end_date: null,
          price_cents: 300,
          active: true,
        },
      ],
    });

    const result = await setActiveSkin("sumi-id");
    expect(result).toEqual({ ok: true });
    expect(mockUpdate).toHaveBeenCalledWith({ active_skin_id: "sumi-id" });
  });

  it("allows free user with entitlement to set a purchased premium skin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockGetViewer.mockResolvedValue({
      userId: "u1",
      isPro: false,
      activeSkinId: null,
      ownedSkinIds: new Set(["sumi-id"]),
      allSkins: [
        {
          id: "sumi-id",
          slug: "sumi-e",
          kind: "premium",
          name: "Sumi-e",
          kanji_label: "墨",
          seal_kanji: "墨",
          palette_key: "sumi",
          masthead: "",
          start_date: null,
          end_date: null,
          price_cents: 300,
          active: true,
        },
      ],
    });

    const result = await setActiveSkin("sumi-id");
    expect(result).toEqual({ ok: true });
    expect(mockUpdate).toHaveBeenCalledWith({ active_skin_id: "sumi-id" });
  });

  it("returns 'not found' for unknown skin id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockGetViewer.mockResolvedValue({
      userId: "u1",
      isPro: true,
      activeSkinId: null,
      ownedSkinIds: new Set(),
      allSkins: [],
    });

    const result = await setActiveSkin("nonexistent");
    expect(result).toEqual({ ok: false, error: "not found" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- setActiveSkin`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the action**

```ts
// app/actions/skins.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { canApplyOverride } from "@/lib/skins/resolve";
import { getViewer } from "@/lib/skins/viewer";

export type SetActiveSkinResult =
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "not found" | "not entitled" | "write failed" };

export async function setActiveSkin(skinId: string | null): Promise<SetActiveSkinResult> {
  const sb = createServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Clearing the override always allowed.
  if (skinId === null) {
    const { error } = await sb
      .from("profiles")
      .update({ active_skin_id: null })
      .eq("id", user.id);
    if (error) {
      console.error("[actions/skins] clear failed:", error);
      return { ok: false, error: "write failed" };
    }
    revalidatePath("/", "layout");
    return { ok: true };
  }

  // Setting an override: verify entitlement server-side using the same predicate
  // the resolver uses (canApplyOverride). Never trust client-side isPro flags.
  const viewer = await getViewer();
  const skin = viewer.allSkins.find((s) => s.id === skinId);
  if (!skin) return { ok: false, error: "not found" };

  const allowed = canApplyOverride({
    isPro: viewer.isPro,
    skin,
    ownedSkinIds: viewer.ownedSkinIds,
  });
  if (!allowed) return { ok: false, error: "not entitled" };

  const { error } = await sb
    .from("profiles")
    .update({ active_skin_id: skinId })
    .eq("id", user.id);
  if (error) {
    console.error("[actions/skins] update failed:", error);
    return { ok: false, error: "write failed" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- setActiveSkin`
Expected: 6/6 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/skins.ts tests/actions/setActiveSkin.test.ts
git commit -m "feat(skins): setActiveSkin server action with entitlement gate"
```

---

## Phase 5 — Skin catalog page

The shippable surface — `/skins`.

### Task 8: Catalog page scaffold + seasonal section

**Files:**
- Create: `app/skins/page.tsx`
- Create: `components/skins/SkinCard.tsx`

- [ ] **Step 1: Write the SkinCard client component**

```tsx
// components/skins/SkinCard.tsx
"use client";
import { setActiveSkin } from "@/app/actions/skins";
import { useTransition } from "react";
import type { SkinRecord } from "@/lib/skins/types";
import type { CatalogAction } from "@/lib/skins/catalog";

interface SkinCardProps {
  skin: SkinRecord;
  action: CatalogAction;
}

function priceLabel(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function SkinCard({ skin, action }: SkinCardProps) {
  const [pending, startTransition] = useTransition();

  if (action.kind === "hidden") return null;

  return (
    <article
      data-skin={skin.palette_key}
      className="border border-sumi/15 p-6 flex flex-col gap-4 bg-bone"
    >
      <header className="flex items-baseline gap-3">
        <div className="stamp text-[28px]">{skin.kanji_label}</div>
        <div>
          <div className="mincho text-[18px] text-sumi font-semibold">{skin.name}</div>
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-moss mt-0.5">
            {skin.kind === "season" ? "seasonal volume" : "premium edition"}
          </div>
        </div>
      </header>

      <div className="ital text-sumi/70 text-[14px]">{skin.masthead}</div>

      <footer className="mt-auto pt-2">
        {renderAction(action, skin, pending, startTransition)}
      </footer>
    </article>
  );
}

function renderAction(
  action: CatalogAction,
  skin: SkinRecord,
  pending: boolean,
  startTransition: React.TransitionStartFunction,
) {
  switch (action.kind) {
    case "wearing":
      return (
        <div className="flex items-center justify-between gap-3">
          <span className="mono text-[11px] tracking-[0.18em] uppercase text-vermillion">
            wearing now
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void setActiveSkin(null))}
            className="mono text-[11px] tracking-[0.18em] uppercase text-moss hover:text-sumi disabled:opacity-50"
          >
            revert
          </button>
        </div>
      );
    case "wear":
      return (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void setActiveSkin(action.skinId))}
          className="btn-hako w-full justify-center disabled:opacity-50"
        >
          Wear this
        </button>
      );
    case "wear-included":
      return (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void setActiveSkin(action.skinId))}
          className="btn-hako w-full justify-between disabled:opacity-50"
        >
          <span>Wear · included with Pro</span>
          <span className="font-jakarta font-light">→</span>
        </button>
      );
    case "buy":
      return (
        <form action="/api/stripe/checkout/skin" method="POST">
          <input type="hidden" name="slug" value={action.slug} />
          <button type="submit" className="btn-hako red w-full justify-between">
            <span>Buy · {priceLabel(action.priceCents)}</span>
            <span className="font-jakarta font-light">→</span>
          </button>
        </form>
      );
    case "in-print":
      return (
        <div className="mono text-[11px] tracking-[0.18em] uppercase text-vermillion">
          in print now
        </div>
      );
    case "back-issue":
      return (
        <div className="mono text-[11px] tracking-[0.18em] uppercase text-moss">
          from {action.seasonName}
        </div>
      );
    case "future": {
      const formatted = new Date(action.startDate + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      );
      return (
        <div className="mono text-[11px] tracking-[0.18em] uppercase text-moss/70">
          coming {formatted}
        </div>
      );
    }
    case "hidden":
      return null;
  }
}
```

`disabled` + `useTransition` give a working pending state; the `onClick` fires the server action and the page revalidates so the next render shows the new "wearing now" state. We don't surface server errors to the user here — failure cases (`not entitled`, `not found`) are guard rails that won't trip if the catalog UI is correct, and a silent revert-to-prev on failure is acceptable for a prototype. If the action fails, the action result is dropped on the floor; the user sees the page revert. Wire toasts later if we ever see real failure paths.

- [ ] **Step 2: Write the catalog page**

```tsx
// app/skins/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/Masthead";
import { SkinCard } from "@/components/skins/SkinCard";
import { SkinChip } from "@/components/skins/SkinChip";
import { getViewer } from "@/lib/skins/viewer";
import { getCatalogAction } from "@/lib/skins/catalog";

export const dynamic = "force-dynamic";

export default async function SkinsPage({
  searchParams,
}: {
  searchParams: { purchased?: string; canceled?: string };
}) {
  const sb = createServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const viewer = await getViewer();
  const today = new Date().toISOString().slice(0, 10);
  const initial = (user.email ?? "·")[0] ?? "·";

  const seasons = viewer.allSkins
    .filter((s) => s.kind === "season")
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
  const premium = viewer.allSkins.filter(
    (s) => s.kind === "premium" && s.slug !== "default",
  );

  return (
    <main className="min-h-screen bg-bone">
      <Masthead
        active="profile"
        initial={initial}
        email={user.email ?? null}
        rightChip={<SkinChip />}
      />

      <div className="max-w-[960px] mx-auto px-6 md:px-10 pt-10 pb-20">
        <header className="mb-12">
          <div className="eyebrow red">巻 · back issues &amp; editions</div>
          <h1 className="h-disp text-[clamp(40px,8vw,64px)] mt-2 text-sumi leading-[0.95]">
            The skin rack.
          </h1>
          <p className="ital text-sumi/65 text-[18px] mt-3 max-w-[560px]">
            Seasons come in print, then file as back issues. Premium editions stay on the
            shelf. Pro members wear any of them; one-off purchases stay yours.
          </p>
        </header>

        {searchParams.purchased && (
          <div
            role="status"
            className="border border-vermillion/30 bg-vermillion/5 px-5 py-4 mb-10"
          >
            <div className="mono text-[11px] tracking-[0.18em] uppercase text-vermillion">
              thanks
            </div>
            <div className="mincho text-[14px] text-sumi mt-1">
              Your purchase is processing. The skin will appear in your library once
              payment confirms.
            </div>
          </div>
        )}

        {searchParams.canceled && (
          <div className="mono text-[11px] tracking-[0.18em] uppercase text-moss mb-10">
            checkout canceled · no charge
          </div>
        )}

        <section className="mb-16">
          <h2 className="mincho text-[20px] text-sumi mb-6">Seasonal volumes · 季</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {seasons.map((s) => (
              <SkinCard key={s.id} skin={s} action={getCatalogAction(s, viewer, today)} />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mincho text-[20px] text-sumi mb-6">Premium editions · 別</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {premium.map((s) => (
              <SkinCard key={s.id} skin={s} action={getCatalogAction(s, viewer, today)} />
            ))}
          </div>
        </section>

        {!viewer.isPro && (
          <footer className="border-t border-sumi/12 pt-10 text-center">
            <div className="ital text-sumi/65 text-[16px] mb-4">
              or go Pro — every skin, every season, every back issue.
            </div>
            <Link href="/pro" className="btn-hako red">
              See Pro
            </Link>
          </footer>
        )}
      </div>
    </main>
  );
}
```

This file imports `<SkinChip />` (Task 10) and uses `Masthead`'s new `rightChip` prop (Task 11). The page won't typecheck until those tasks land. We commit it last, after the chip exists.

- [ ] **Step 3: Hold the commit until the page typechecks**

Don't commit the file yet — wait until Task 10 and Task 11 are done. We'll commit the catalog page together with the chip integration in Task 12.

If you must commit eagerly, comment out the `import { SkinChip }` line and the `rightChip={<SkinChip />}` prop, then uncomment in Task 12. Cleaner to wait.

---

## Phase 6 — Pro skin chip + picker

The masthead-area control that lets Pro users override their chrome.

### Task 9: Picker client component

**Files:**
- Create: `components/skins/SkinPicker.tsx`

- [ ] **Step 1: Implement the picker**

```tsx
// components/skins/SkinPicker.tsx
"use client";

import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveSkin } from "@/app/actions/skins";
import type { SkinRecord } from "@/lib/skins/types";

interface SkinPickerProps {
  wearableSkins: SkinRecord[];
  activeSkinId: string | null;
  currentLabel: string;
  currentKanji: string;
}

export function SkinPicker({
  wearableSkins,
  activeSkinId,
  currentLabel,
  currentKanji,
}: SkinPickerProps) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const onPick = (id: string | null) => {
    setOpen(false);
    startTransition(() => void setActiveSkin(id));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={pending}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-sumi/20 hover:border-sumi/40 transition-colors disabled:opacity-50 mono text-[10px] tracking-[0.16em] uppercase text-moss focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion"
        aria-label={`change skin · currently ${currentLabel}`}
      >
        <span className="mincho text-[14px] text-sumi normal-case tracking-normal">
          {currentKanji}
        </span>
        <span>wearing · {currentLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="bg-bone border-[1.5px] border-sumi rounded-none p-0 min-w-[220px] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]"
      >
        <DropdownMenuLabel className="mono text-[10px] tracking-[0.18em] uppercase text-moss px-3 py-2.5">
          choose a skin
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-sumi/15 m-0" />

        <DropdownMenuItem
          onSelect={() => onPick(null)}
          className="rounded-none focus:bg-rice cursor-pointer mincho text-[14px] text-sumi px-3 py-2.5 flex justify-between"
        >
          <span>Use the season&rsquo;s skin</span>
          {activeSkinId === null && <span className="text-vermillion">·</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-sumi/15 m-0" />

        {wearableSkins.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => onPick(s.id)}
            className="rounded-none focus:bg-rice cursor-pointer mincho text-[14px] text-sumi px-3 py-2.5 flex justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-[16px]">{s.kanji_label}</span>
              <span>{s.name}</span>
            </span>
            {activeSkinId === s.id && <span className="text-vermillion">·</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors. The component imports types and `setActiveSkin` (Task 7) and `DropdownMenu` (existing).

- [ ] **Step 3: Commit**

```bash
git add components/skins/SkinPicker.tsx
git commit -m "feat(skins): SkinPicker client component"
```

---

### Task 10: Server `<SkinChip />` component

**Files:**
- Create: `components/skins/SkinChip.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/skins/SkinChip.tsx
import { getViewer } from "@/lib/skins/viewer";
import { canApplyOverride } from "@/lib/skins/resolve";
import { resolveActiveSkinServer } from "@/lib/skins/server";
import { SkinPicker } from "./SkinPicker";

export async function SkinChip() {
  const viewer = await getViewer();

  // Free users never see this control. Per spec: setting an override is a
  // Pro-only capability. (Free users with one-off purchases also don't see
  // the picker — they're shown the catalog instead. Spec section
  // "Architecture overview", invariant 3.)
  if (!viewer.isPro) return null;

  // Wearable = anything an override-capable user can apply.
  // For Pro this is every active skin except 'default' (engine plumbing).
  const wearable = viewer.allSkins.filter(
    (s) =>
      s.slug !== "default" &&
      canApplyOverride({
        isPro: viewer.isPro,
        skin: s,
        ownedSkinIds: viewer.ownedSkinIds,
      }),
  );

  // What they're currently wearing on the home/chrome surface.
  const current = await resolveActiveSkinServer({ surface: "home", viewer });

  return (
    <SkinPicker
      wearableSkins={wearable}
      activeSkinId={viewer.activeSkinId}
      currentLabel={current.slug === "default" ? "Default" : findName(viewer.allSkins, current.slug)}
      currentKanji={current.kanjiLabel}
    />
  );
}

function findName(skins: { slug: string; name: string }[], slug: string): string {
  return skins.find((s) => s.slug === slug)?.name ?? slug;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/skins/SkinChip.tsx
git commit -m "feat(skins): SkinChip server component (Pro-only render)"
```

---

### Task 11: Add `rightChip` slot to Masthead

**Files:**
- Modify: `components/Masthead.tsx`

- [ ] **Step 1: Add the prop and render slot**

In `MastheadProps`, add a new optional prop right after `solvedCount`:

```ts
interface MastheadProps {
  active?: NavKey;
  initial?: string;
  email?: string | null;
  variant?: "default" | "game";
  gameTitle?: string;
  timer?: React.ReactNode;
  solvedCount?: { filled: number; total: number };
  /** Additional chip rendered in the masthead's right cluster (default variant only). */
  rightChip?: React.ReactNode;
  onSensei?: () => void;
}
```

Update the `Masthead` function signature to destructure `rightChip`:

```ts
export function Masthead({
  active,
  initial = "·",
  email,
  variant = "default",
  gameTitle,
  timer,
  solvedCount,
  rightChip,
  onSensei,
}: MastheadProps) {
```

In the **default variant** return block (currently around line 210-222), modify the right-side flex container to render `rightChip` before the avatar:

```tsx
<div className="flex items-center gap-[16px] md:gap-[22px] text-[13px] text-moss">
  {rightChip}
  {email ? (
    <AvatarDropdown initial={initial} email={email} />
  ) : (
    <Link
      href="/auth/login"
      className="avatar hover:bg-vermillion hover:text-bone transition-colors"
      aria-label="sign in"
    >
      {initial.toUpperCase()}
    </Link>
  )}
</div>
```

The chip's own component (`SkinPicker`) handles its mobile visibility (it uses `hidden md:flex`); on smaller screens the chip is invisible, leaving the avatar as the only right-side control. This honors the spec's "Pro skin chip moves into AvatarDropdown on small screens" — the AvatarDropdown integration ships as **deferred mobile work** (see "Deferred / follow-ups" at the bottom of this plan).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/Masthead.tsx
git commit -m "feat(masthead): add rightChip slot"
```

---

### Task 12: Wire `<SkinChip />` into pages + commit catalog page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/play/page.tsx`
- Create (commit): `app/skins/page.tsx`, `components/skins/SkinCard.tsx`

- [ ] **Step 1: Add `<SkinChip />` to home page**

In `app/page.tsx:249` (the signed-in masthead), modify:

```tsx
<Masthead active="today" initial={initial} email={user.email ?? null} />
```

to:

```tsx
<Masthead
  active="today"
  initial={initial}
  email={user.email ?? null}
  rightChip={<SkinChip />}
/>
```

Add the import at the top:

```ts
import { SkinChip } from "@/components/skins/SkinChip";
```

Do NOT add the chip to the signed-out masthead (line 211) — `<SkinChip />` returns null for unauthed viewers but it'd still trigger the auth/profile fetch on every render. Skip it cleanly.

- [ ] **Step 2: Add `<SkinChip />` to casual landing**

In `app/play/page.tsx:21`:

```tsx
<Masthead active="play" initial={initial} email={user?.email ?? null} />
```

becomes:

```tsx
<Masthead
  active="play"
  initial={initial}
  email={user?.email ?? null}
  rightChip={user ? <SkinChip /> : null}
/>
```

The `user ? ... : null` guard skips the chip entirely on the signed-out state (saves the render fetch).

Add the import:

```ts
import { SkinChip } from "@/components/skins/SkinChip";
```

- [ ] **Step 3: Verify the catalog page compiles**

The catalog page at `app/skins/page.tsx` (created in Task 8 but not committed) and `components/skins/SkinCard.tsx` should now typecheck cleanly because all their dependencies exist.

Run: `npm run typecheck`
Expected: no errors. If `SkinChip` import fails, double-check Task 10 actually shipped the file.

- [ ] **Step 4: Smoke test in dev**

Run: `npm run dev`

Test as a free user:
- Visit `/` — masthead shows no chip (good, Pro-only).
- Visit `/skins` — see seasons + premium sections; sumi-e and indigo show "Buy · $3"; current season shows "in print now"; click "Buy · $3" — should redirect to Stripe.

Test as a Pro user (`update profiles set is_pro = true where id = '<your-uuid>';`):
- Visit `/` — masthead shows the picker chip on md+ screens (`wearing · Spring 2026`).
- Click the chip — dropdown opens with all skins listed.
- Pick "Sumi-e" — page revalidates, body's `data-skin` becomes `sumi`, palette swaps; chip now reads `wearing · Sumi-e`.
- Pick "Use the season's skin" — reverts to current season.
- Visit `/skins` — sumi-e card shows "wearing now / revert"; other premium cards show "Wear · included with Pro".

Resize the browser narrower than `md` (768px) — the chip disappears (handled by the picker's own `hidden md:flex` class). Confirm avatar still works.

- [ ] **Step 5: Add and commit everything for Phase 5+6**

```bash
git add app/page.tsx app/play/page.tsx app/skins/page.tsx components/skins/SkinCard.tsx
git commit -m "feat(skins): catalog page + masthead chip integration"
```

---

## Phase 7 — Final verification

### Task 13: Full-build verification

**Files:** none modified — this is a checklist task.

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors. If lint warnings appear in your new files, fix them before commit. If they appear in untouched files, leave them — out of scope.

- [ ] **Step 3: Run all tests**

Run: `npm run test`
Expected: all green. New test count = 92 (Plan 1) + 11 (catalog) + 5 (skin-prices) + 6 (setActiveSkin) = **114/114**.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success; new route `/skins` listed in the build output along with `/api/stripe/checkout/skin`. Page count goes from 18 to 20.

- [ ] **Step 5: Manual end-to-end smoke**

```
npm run dev
```

As a free user with a fresh account:
1. `/` — no skin chip in masthead. Today's daily wears the current season skin (e.g. spring palette in April).
2. `/skins` — see catalog. Premium skins show "Buy · $3". Click one — get redirected to Stripe.
3. Cancel out of Stripe → land back on `/skins?canceled=1` with the canceled banner.

As a Pro user (manually flipped via SQL):
1. `/` — skin chip visible at md+. Reads `wearing · Spring 2026` (or whatever's current).
2. Click chip → pick `Sumi-e` → palette swaps page-wide; chip updates to `wearing · Sumi-e`.
3. `/play/easy` — chrome wears Sumi-e (override carries to casual surfaces).
4. `/play/daily` — chrome **does not** wear Sumi-e (daily is locked to the publication date's skin — verify by inspecting `body[data-skin]`).
5. `/skins` — Sumi-e card shows "wearing now / revert"; other skins show "Wear · included with Pro".

As any user:
- `/pro` — three bullets: coach unlimited, expert+archive, **The full skin library** (verify the bullet copy matches Task 1).

- [ ] **Step 6: Open the PR**

```bash
git push -u origin <branch-name>
gh pr create --title "feat: skin catalog & monetization (Plan 2)" --body "$(cat <<'EOF'
## Summary
- Adds /skins catalog page with seasonal volumes + premium editions
- Adds POST /api/stripe/checkout/skin (one-off Stripe payment)
- Refreshes /pro third bullet to "The full skin library."
- Adds Pro-only skin picker chip to masthead (md+; signed-in home + casual landing)
- Adds setActiveSkin server action with server-side entitlement gate

## Spec & plan
- Spec: docs/superpowers/specs/2026-05-09-volumes-skins-vfx-design.md
- Plan: docs/superpowers/plans/2026-05-10-skin-catalog-and-monetization.md

## Out of scope (deferred)
- Stripe webhook (still TODO; manual SQL fallback for both Pro and skin entitlements)
- Skin gifting flow
- Mobile chip (today: hidden < md; chip-in-AvatarDropdown work tracked in plan footer)
- Plan 3 — VFX/SFX (separate branch)

## Required env vars before deploy
- STRIPE_PRICE_ID_SKIN_SUMI
- STRIPE_PRICE_ID_SKIN_INDIGO

## Test plan
- [ ] npm run typecheck
- [ ] npm run lint
- [ ] npm run test (114/114)
- [ ] npm run build (20 routes)
- [ ] Manual: free user buy flow → Stripe checkout
- [ ] Manual: Pro user picker swap → palette + chip update
- [ ] Manual: daily route stays locked to publication skin
- [ ] Verify /pro bullet copy

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Deferred / follow-ups (out of this plan, worth a chip)

These are **acknowledged gaps**, not oversights — flag them in the PR description so reviewers don't ask:

- **Mobile picker in AvatarDropdown.** Spec says the chip should move into AvatarDropdown on small screens. This plan ships chip-only on `md+` and hides it below. Adding the dropdown menu item is straightforward (mirror the existing Profile/Achievements items, point at a modal-shaped picker) but cuts cleanly from the desktop work and is a separate task.
- **Toast confirmations on action failures.** The `setActiveSkin` action returns errors but the catalog UI silently drops them. Wire up `useToast` (already in the codebase via `components/ui/toaster.tsx`) when we see real failures in production.
- **Stripe webhook.** Still a TODO inherited from the Pro flow. The manual SQL fallback is documented in the route's TODO comment for both Pro and skin entitlements. Webhook work is its own task; ship without it.
- **Default skin presentation.** The `default` skin renders nothing in the catalog (kind: "hidden") because it's engine plumbing, not a product. If a user is somehow wearing the default explicitly (e.g. seed misconfiguration), the chip will read `wearing · Default` which is honest if a bit ugly. Not worth fixing yet.
- **Future-season "preview" rendering.** Catalog shows future seasons with "coming Dec 1" — locked even for Pro per the editorial constraint in the spec. If we ever decide Pro can wear future seasons, change the `getSeasonAction` `isFuture` branch to check `viewer.isPro`.

---

## Self-review checklist

Run this before declaring the plan ready for execution:

**Spec coverage** — for each spec section, point to a task:
- `Skin catalog → app/skins/page.tsx` → Task 8
- `POST /api/stripe/checkout/skin` → Task 3
- `/pro` page bullet swap → Task 1
- Pro skin chip + override picker → Tasks 9, 10, 11, 12
- Stripe price IDs as env vars → Task 3 (documented in env example) + PR description
- `canSeeInCatalog`-style filtering → Task 6 (via `getCatalogAction` returning `hidden` for default + unconfigured premium)
- Section ordering (seasons first, premium second, footer CTA) → Task 8
- Mobile responsive → partially deferred (see "Deferred / follow-ups")

**Type consistency** — each function called in a later task is defined in an earlier task with the same signature:
- `setActiveSkin(skinId: string | null)` defined Task 7, called Tasks 8 (SkinCard), 9 (SkinPicker)
- `getViewer()` defined Task 4, called Tasks 5, 7, 8, 10
- `getCatalogAction` defined Task 6, called Task 8
- `canApplyOverride` from existing Plan 1 code, called Tasks 7, 10
- `resolveActiveSkinServer` updated Task 5, called Task 10 with `viewer` arg
- `Masthead` `rightChip` prop added Task 11, used Task 12
- `SkinChip` defined Task 10, used Tasks 8, 12
- `SkinPicker` defined Task 9, used Task 10
- `SkinCard` defined Task 8, used Task 8 (catalog page)

**No placeholders** — search this doc for "TODO", "TBD", "implement later", "fill in", "similar to", "add appropriate". Confirm none appear in step bodies (the only TODO is intentional: the Stripe webhook TODO comment in the new route mirrors the existing Pro endpoint's TODO).

**File-path uniqueness** — every Create file lists a path that doesn't exist yet (verified against current repo state at plan-write time).

---

**Plan complete.** 13 tasks, ~7 commits, ships a working /skins catalog and a working Pro picker chip without touching the daily-skin lock or Plan 3 work.
