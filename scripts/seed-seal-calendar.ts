// scripts/seed-seal-calendar.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { assignKanjiForRange } from "@/lib/seal/calendar";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const startStr = today.toISOString().slice(0, 10);
const DAYS_AHEAD = 730;

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const entries = assignKanjiForRange(startStr, DAYS_AHEAD);

  const chunkSize = 200;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize).map((e) => ({
      date: e.date,
      kanji: e.kanji,
      romaji: e.romaji,
      meaning: e.meaning,
    }));
    const { error } = await sb.from("daily_seal_calendar").upsert(chunk, { onConflict: "date" });
    if (error) {
      console.error("chunk failed:", error);
      process.exit(1);
    }
    console.log(`upserted ${i + chunk.length} / ${entries.length}`);
  }
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
