import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

/** Earned-count number + 12-mark ledger grid. */
export function AchievementsBodySkeleton() {
  return (
    <div className="mt-9">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <SkeletonBox className="w-[64px] h-[64px]" />
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
