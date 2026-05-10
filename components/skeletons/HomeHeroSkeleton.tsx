import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

/**
 * Hero band placeholder: TodayCard (left, 1.4fr) + YouTodayPanel (right, 1fr).
 * Used by app/loading.tsx and as the Suspense fallback in app/page.tsx.
 */
export function HomeHeroSkeleton() {
  return (
    <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] lg:gap-12 items-start">
      <SkeletonBox className="h-[320px] w-full" />
      <div className="mt-8 lg:mt-0">
        <SkeletonBox className="h-[260px] w-full" />
      </div>
    </section>
  );
}
