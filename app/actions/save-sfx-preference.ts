"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function saveSfxPreference(input: { enabled: boolean }) {
  const sb = createServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return { ok: false as const, error: "auth" as const };

  const { data, error } = await sb
    .from("profiles")
    .update({ sfx_enabled: input.enabled })
    .eq("id", user.id)
    .select("sfx_enabled")
    .maybeSingle();

  if (error || !data) {
    return { ok: false as const, error: "db" as const };
  }

  revalidatePath("/account");
  revalidatePath("/play/daily");
  revalidatePath("/play/[difficulty]", "page");

  return { ok: true as const, enabled: Boolean(data.sfx_enabled) };
}
