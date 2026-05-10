import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

/** Stats triplet (stamped/streak/filled) — sits inside the page <header> grid. */
export function YearStatsSkeleton() {
  return (
    <dl className="grid grid-cols-3 gap-x-10 gap-y-2 self-end">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <SkeletonBox className="h-3 w-16" />
          <SkeletonBox className="h-9 w-20 mt-1" />
        </div>
      ))}
    </dl>
  );
}

/** The year-scroll body — sits below the page <header>. */
export function YearScrollSkeleton() {
  return (
    <section className="mt-10 lg:mt-14 relative">
      <SkeletonBox className="h-[420px] w-full" />
    </section>
  );
}

/**
 * Combined stats + scroll skeleton. Returns a fragment, so it must be
 * rendered at a position where both halves can flow correctly (e.g. as a
 * page-level fallback, NOT inside a grid cell). For the split Suspense
 * boundaries on `/year`, use `YearStatsSkeleton` and `YearScrollSkeleton`
 * directly.
 */
export function YearStatsAndScrollSkeleton() {
  return (
    <>
      <YearStatsSkeleton />
      <YearScrollSkeleton />
    </>
  );
}
