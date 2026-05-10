import type { SkinRecord } from "./types";
import type { Viewer } from "./viewer";
import { getPriceIdForSkinSlug } from "@/lib/stripe/skin-prices";

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
  // Real Stripe price ID must be present — not just an allow-listed slug — so a
  // user never sees "Buy" for a skin whose env var is unset (and would 503 at checkout).
  if (skin.price_cents !== null && getPriceIdForSkinSlug(skin.slug)) {
    return { kind: "buy", slug: skin.slug, priceCents: skin.price_cents };
  }
  // Premium skin without a Stripe price configured — treat as hidden.
  return { kind: "hidden" };
}

function getSeasonAction(
  skin: SkinRecord,
  viewer: Viewer,
  today: string,
): CatalogAction {
  if (!skin.start_date || !skin.end_date) {
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
