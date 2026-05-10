import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Premium skins must have STRIPE_PRICE_ID_SKIN_* set for `buy` to be returned.
  process.env.STRIPE_PRICE_ID_SKIN_SUMI = "price_test_sumi";
  process.env.STRIPE_PRICE_ID_SKIN_INDIGO = "price_test_indigo";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

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
