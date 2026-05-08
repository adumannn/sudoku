import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/utils";
import { getOrCreateLine } from "@/lib/seal/sensei";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createServerClient();
  const date = todayUTC();

  const { data: cal } = await sb
    .from("daily_seal_calendar")
    .select("date,kanji,romaji,meaning")
    .eq("date", date)
    .maybeSingle();

  if (!cal) {
    return NextResponse.json(
      { date, kanji: null, senseiLine: null },
      { status: 200 },
    );
  }

  const senseiLine = await getOrCreateLine(date, cal);
  return NextResponse.json({
    date,
    kanji: cal.kanji,
    romaji: cal.romaji,
    meaning: cal.meaning,
    senseiLine,
  });
}
