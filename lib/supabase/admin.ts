import { createClient } from "@supabase/supabase-js";

export const adminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SERVICE_ROLE_KEY missing");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
};
