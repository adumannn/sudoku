import Link from "next/link";
import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

/**
 * The Pro page renders on a dark seal background with its own minimal top bar.
 * Skeleton mirrors that top bar + the centered column layout.
 */
export default function Loading() {
  return (
    <main className="bg-seal text-bone min-h-screen relative">
      <div className="flex justify-between items-center px-8 py-5 border-b border-bone/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-vermillion text-bone flex items-center justify-center mincho font-bold text-[14px]">
            箱
          </div>
          <div className="mincho font-semibold text-[16px]">Hako Pro</div>
        </Link>
        <Link
          href="/"
          className="mono text-[11px] tracking-[0.2em] text-bone/65 uppercase hover:text-bone"
        >
          close ×
        </Link>
      </div>
      <div className="max-w-[520px] mx-auto px-8 py-16 lg:py-24 text-center">
        <SkeletonBox className="h-3 w-44 mx-auto bg-bone/[0.08] border-bone/10" />
        <SkeletonBox className="h-[80px] w-full mt-4 bg-bone/[0.06] border-bone/10" />
        <SkeletonBox className="h-3 w-72 mx-auto mt-6 bg-bone/[0.06] border-bone/10" />
        <ul className="list-none p-0 mt-12 text-left space-y-6">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-5 items-start">
              <SkeletonBox className="size-12 shrink-0 bg-bone/[0.06] border-bone/10" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-1/2 bg-bone/[0.06] border-bone/10" />
                <SkeletonBox className="h-3 w-full bg-bone/[0.04] border-bone/10" />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex items-baseline justify-center gap-3.5">
          <SkeletonBox className="h-12 w-20 bg-bone/[0.08] border-bone/10" />
          <SkeletonBox className="h-3 w-24 bg-bone/[0.06] border-bone/10" />
        </div>
        <SkeletonBox className="h-12 w-full mt-6 bg-bone/[0.08] border-bone/10" />
      </div>
    </main>
  );
}
