import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

/**
 * "your year" header + year-scroll body placeholder. Sized to match
 * a horizontal 365-cell scroll on home (cellPx default ~24, gapPx 4).
 */
export function HomeYearSkeleton() {
  return (
    <section className="mt-12">
      <div className="flex justify-between items-baseline mb-3">
        <div className="eyebrow">your year</div>
        <SkeletonBox className="h-3 w-16" />
      </div>
      <SkeletonBox className="h-[160px] w-full" />
    </section>
  );
}
