import { createServerClient } from "@/lib/supabase/server";

export async function getSfxEnabledServer(): Promise<boolean> {
  const sb = createServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return false;

  const { data, error } = await sb
    .from("profiles")
    .select("sfx_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[sfx/server] profiles.select:", error);
    return false;
  }

  return Boolean(data?.sfx_enabled);
}
