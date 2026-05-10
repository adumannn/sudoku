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
