import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

/** City rail + ledger table (20 rows of placeholders). */
export function LeaderboardPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] max-w-[1480px] mx-auto">
      <aside className="border-r border-sumi/15 lg:border-r-2 lg:border-r-sumi p-7 lg:p-9">
        <div className="eyebrow mb-3.5">solving in</div>
        <SkeletonBox className="h-9 w-32" />
        <div className="eyebrow mt-8 mb-3">cities</div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} className="h-7 w-full" />
          ))}
        </div>
      </aside>
      <section className="p-7 lg:p-14">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-3.5">
          <div className="space-y-2">
            <SkeletonBox className="h-3 w-64" />
            <SkeletonBox className="h-10 w-72" />
          </div>
          <div className="flex gap-1.5">
            <SkeletonBox className="h-7 w-16" />
            <SkeletonBox className="h-7 w-16" />
            <SkeletonBox className="h-7 w-16" />
          </div>
        </div>
        <div className="mt-7 border-t-2 border-sumi">
          <div className="led-row hd">
            <div>rank</div>
            <div>solver</div>
            <div>time</div>
            <div>hints</div>
            <div className="col-hide-md">finished</div>
            <div className="col-hide-md"></div>
          </div>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="led-row">
              <SkeletonBox className="h-4 w-7" />
              <SkeletonBox className="h-4 w-32" />
              <SkeletonBox className="h-4 w-14" />
              <SkeletonBox className="h-4 w-7" />
              <SkeletonBox className="h-4 w-12 col-hide-md" />
              <div className="col-hide-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
