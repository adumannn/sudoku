import { MastheadSkeleton } from "@/components/skeletons/MastheadSkeleton";
import { LeaderboardPanelSkeleton } from "@/components/skeletons/LeaderboardPanelSkeleton";

export default function Loading() {
  return (
    <>
      <MastheadSkeleton />
      <LeaderboardPanelSkeleton />
    </>
  );
}
