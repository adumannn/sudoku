import { MastheadSkeleton } from "@/components/skeletons/MastheadSkeleton";
import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

export default function Loading() {
  return (
    <>
      <MastheadSkeleton />
      <main>
        <section className="grid grid-cols-1 lg:grid-cols-[360px_1fr] border-b-[1.5px] border-sumi bg-bone">
          {/* Left rail */}
          <div className="bg-rice border-b lg:border-b-0 lg:border-r-[1.5px] border-sumi p-10 lg:px-12 lg:py-14 flex flex-col gap-9">
            <div>
              <SkeletonBox className="h-3 w-32" />
              <SkeletonBox className="w-20 h-20 mt-3.5 mb-[18px]" />
              <SkeletonBox className="h-10 w-40" />
              <SkeletonBox className="h-3 w-48 mt-2.5" />
              <SkeletonBox className="h-4 w-2/3 mt-[18px]" />
            </div>
            {/* Streak block + body share fallback shape between loading.tsx and Suspense fallback */}
            <ProfileBodySkeletonLeftRailOnly />
            <div className="mt-auto pt-6 border-t border-sumi/18">
              <SkeletonBox className="h-12 w-full" />
            </div>
          </div>
          {/* Right column */}
          <div className="p-8 lg:p-12 flex flex-col gap-12">
            <ProfileBodySkeletonRightColOnly />
          </div>
        </section>
      </main>
    </>
  );
}

/* Visually, ProfileBodySkeleton is rendered split across two grid cells.
 * In Task 15 (Suspense split), the same shape is rendered as one block
 * inside a wrapper that participates in the same grid; loading.tsx
 * inlines the two halves to occupy both rail and column directly. */
function ProfileBodySkeletonLeftRailOnly() {
  return (
    <div className="pt-7 border-t border-sumi/18">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-[112px] w-32 mt-2" />
      <SkeletonBox className="h-3 w-3/4 mt-3" />
    </div>
  );
}

function ProfileBodySkeletonRightColOnly() {
  return (
    <>
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
    </>
  );
}
