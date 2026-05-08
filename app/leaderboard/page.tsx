import { createServerClient } from "@/lib/supabase/server";
import { todayUTC, formatTime } from "@/lib/utils";

interface Row {
  user_id: string;
  elapsed_seconds: number;
  city: string | null;
  created_at: string;
  profiles: { username: string | null } | null;
}

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: { city?: string; date?: string };
}) {
  const sb = createServerClient();
  const date = searchParams.date ?? todayUTC();
  let q = sb
    .from("daily_results")
    .select("user_id,elapsed_seconds,city,created_at,profiles(username)")
    .eq("date", date)
    .order("elapsed_seconds", { ascending: true })
    .limit(100);
  if (searchParams.city) q = q.eq("city", searchParams.city);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <main className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-2">Leaderboard — {date}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {searchParams.city ? `Filtered to ${searchParams.city}` : "Global"}
      </p>
      <ol className="divide-y rounded-lg border">
        {rows.map((row, i) => (
          <li key={row.user_id} className="flex justify-between items-center p-3">
            <div className="flex items-center gap-3">
              <span className="w-6 text-right text-muted-foreground">{i + 1}</span>
              <span>{row.profiles?.username ?? "anon"}</span>
              {row.city && (
                <span className="text-xs text-muted-foreground">{row.city}</span>
              )}
            </div>
            <span className="font-mono">{formatTime(row.elapsed_seconds)}</span>
          </li>
        ))}
        {!rows.length && (
          <li className="p-6 text-center text-sm text-muted-foreground">
            No submissions yet for {date}.
          </li>
        )}
      </ol>
    </main>
  );
}
