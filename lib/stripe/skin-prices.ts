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
  // hasOwn-style check so prototype keys ("constructor", "toString", …) don't slip through.
  return Object.prototype.hasOwnProperty.call(SLUG_TO_ENV, slug);
}
