import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

/** Streak block (left rail) + heatmap + best-time grid + 12 marks (right column). */
export function ProfileBodySkeleton() {
  return (
    <>
      {/* Streak block — bottom of left rail */}
      <div className="pt-7 border-t border-sumi/18">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-[112px] w-32 mt-2" />
        <SkeletonBox className="h-3 w-3/4 mt-3" />
      </div>

      {/* Right column blocks */}
      <div className="profile-body-right-col-skeleton-marker hidden" />
      <div className="space-y-12">
        <div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2 mb-[18px]">
            <SkeletonBox className="h-7 w-64" />
            <SkeletonBox className="h-3 w-40" />
          </div>
          <SkeletonBox className="h-[140px] w-full" />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-[18px] gap-6">
            <SkeletonBox className="h-7 w-48" />
            <SkeletonBox className="h-3 w-32" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-sumi/18">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={
                  "py-5 px-5 border-b border-sumi/12 " +
                  (i === 0 ? "pl-0 " : "") +
                  (i < 3 ? "border-r border-sumi/10 " : "")
                }
              >
                <SkeletonBox className="h-7 w-10" />
                <SkeletonBox className="h-7 w-20 mt-5" />
                <SkeletonBox className="h-3 w-24 mt-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-[18px] gap-6">
            <SkeletonBox className="h-7 w-56" />
            <SkeletonBox className="h-3 w-40" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <SkeletonBox className="w-[54px] h-[54px]" />
                <SkeletonBox className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
