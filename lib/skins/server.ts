import { createServerClient } from "@/lib/supabase/server";
import { resolveActiveSkin } from "./resolve";
import type { SkinRecord, SkinResolved, Surface } from "./types";

interface ResolveServerArgs {
  surface: Surface;
  dailyDate?: string;        // YYYY-MM-DD when surface === "daily"
}

export async function resolveActiveSkinServer(args: ResolveServerArgs): Promise<SkinResolved> {
  const sb = createServerClient();
  const today = new Date().toISOString().slice(0, 10);

  // Fetch all active skins (small table — 7 rows at launch).
  const { data: skinsRaw } = await sb
    .from("skins")
    .select("id,slug,kind,name,kanji_label,seal_kanji,palette_key,masthead,start_date,end_date,price_cents,active")
    .eq("active", true);
  const skins: SkinRecord[] = (skinsRaw ?? []) as unknown as SkinRecord[];

  // Fetch the user's profile (active_skin_id, is_pro) and entitlements.
  const { data: { user } } = await sb.auth.getUser();
  let activeSkinId: string | null = null;
  let isPro = false;
  let ownedSkinIds = new Set<string>();
  if (user) {
    const [{ data: profile }, { data: ents }] = await Promise.all([
      sb.from("profiles").select("active_skin_id,is_pro").eq("id", user.id).maybeSingle(),
      sb.from("user_skin_entitlements").select("skin_id").eq("user_id", user.id),
    ]);
    activeSkinId = profile?.active_skin_id ?? null;
    isPro = profile?.is_pro ?? false;
    ownedSkinIds = new Set((ents ?? []).map((e: { skin_id: string }) => e.skin_id));
  }

  // For daily surface, look up the daily's skin_id.
  let dailySkinId: string | null = null;
  if (args.surface === "daily" && args.dailyDate) {
    const { data: daily } = await sb
      .from("daily_puzzles")
      .select("skin_id")
      .eq("date", args.dailyDate)
      .maybeSingle();
    dailySkinId = daily?.skin_id ?? null;
  }

  return resolveActiveSkin({
    surface: args.surface,
    activeSkinId,
    isPro,
    ownedSkinIds,
    dailySkinId,
    today,
    skins,
  });
}
