// app/leaderboard/page.tsx
import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/utils";
import { Masthead } from "@/components/Masthead";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { LeaderboardPanelSkeleton } from "@/components/skeletons/LeaderboardPanelSkeleton";

export const dynamic = "force-dynamic";

type Range = "today" | "7d" | "all";

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: { city?: string; date?: string; range?: Range };
}) {
  const sb = createServerClient();
  const date = searchParams.date ?? todayUTC();
  const cityFilterRaw = searchParams.city ?? null;
  const cityFilter = cityFilterRaw ? cityFilterRaw.trim().toLowerCase() : null;
  const range: Range = searchParams.range ?? "today";

  const {
    data: { user },
  } = await sb.auth.getUser();
  const username = user?.email?.split("@")[0] ?? null;
  const initial = user?.email?.[0] ?? "·";

  return (
    <>
      <Masthead active="ledger" initial={initial} email={user?.email ?? null} />
      <Suspense fallback={<LeaderboardPanelSkeleton />}>
        <LeaderboardPanel
          userId={user?.id ?? null}
          username={username}
          date={date}
          cityFilter={cityFilter}
          cityFilterRaw={cityFilterRaw}
          range={range}
        />
      </Suspense>
    </>
  );
}
