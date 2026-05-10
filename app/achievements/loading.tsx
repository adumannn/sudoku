import Link from "next/link";
import { MastheadSkeleton } from "@/components/skeletons/MastheadSkeleton";
import { SkeletonBox } from "@/components/skeletons/SkeletonBox";
import { AchievementsBodySkeleton } from "@/components/skeletons/AchievementsBodySkeleton";

export default function Loading() {
  return (
    <>
      <MastheadSkeleton />
      <main className="px-7 lg:px-14 py-12 lg:py-16 max-w-[1480px] mx-auto">
        <Link
          href="/profile"
          className="mono text-[10.5px] tracking-[0.22em] uppercase text-moss hover:text-sumi"
        >
          ← back to profile
        </Link>
        <div className="mt-6 flex justify-between items-end gap-6 border-b-[1.5px] border-sumi pb-[18px]">
          <div>
            <div className="mono text-[11px] tracking-[0.22em] uppercase text-moss">§ achievements</div>
            <SkeletonBox className="h-[42px] w-72 mt-2" />
          </div>
          <SkeletonBox className="h-7 w-28" />
        </div>
        <SkeletonBox className="h-3 w-full max-w-[60ch] mt-6" />
        <SkeletonBox className="h-3 w-2/3 max-w-[60ch] mt-2" />
        <AchievementsBodySkeleton />
      </main>
    </>
  );
}
