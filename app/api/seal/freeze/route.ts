// app/api/seal/freeze/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FREEZES_PER_MONTH = 2;

export async function POST(req: NextRequest) {
  const sb = createServerClient();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await req.json()) as { date?: string };
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: "bad-date" }, { status: 400 });
  }

  // 24-hour window: only allow applying a freeze to a date within the last 24h
  const targetMs = Date.parse(body.date + "T23:59:59Z");
  const ageHours = (Date.now() - targetMs) / 1000 / 3600;
  if (ageHours < 0 || ageHours > 24) {
    return NextResponse.json({ error: "out-of-window" }, { status: 400 });
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("is_pro,created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.is_pro) {
    return NextResponse.json({ error: "pro-only" }, { status: 403 });
  }

  // Allotment check
  const grantedMonth = body.date.slice(0, 7) + "-01";
  const { count } = await sb
    .from("streak_freezes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("granted_month", grantedMonth);
  const used = count ?? 0;
  const allotment = computeAllotment(profile.created_at, grantedMonth);
  if (used >= allotment) {
    return NextResponse.json({ error: "no-freezes" }, { status: 403 });
  }

  // Already completed? No freeze needed.
  const { data: existing } = await sb
    .from("daily_results")
    .select("date")
    .eq("user_id", userId)
    .eq("date", body.date)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "already-completed" }, { status: 400 });
  }

  const { error } = await sb.from("streak_freezes").insert({
    user_id: userId,
    date: body.date,
    granted_month: grantedMonth,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already-frozen" }, { status: 400 });
    }
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, remaining: allotment - used - 1 });
}

/** Pro-rated allotment for the user's first partial month, full afterward. */
function computeAllotment(profileCreatedAt: string, grantedMonth: string): number {
  const monthStart = new Date(grantedMonth + "T00:00:00Z");
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
  const created = new Date(profileCreatedAt);
  if (created < monthStart) return MAX_FREEZES_PER_MONTH;
  if (created >= monthEnd) return 0;
  // Pro-rated for the partial month: ceil((days_left / days_in_month) * 2), capped at 2.
  const daysInMonth = (monthEnd.getTime() - monthStart.getTime()) / 86400000;
  const daysLeft = Math.max(0, (monthEnd.getTime() - created.getTime()) / 86400000);
  return Math.min(MAX_FREEZES_PER_MONTH, Math.ceil((daysLeft / daysInMonth) * MAX_FREEZES_PER_MONTH));
}
