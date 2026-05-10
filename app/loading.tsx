import Link from "next/link";
import { MastheadSkeleton } from "@/components/skeletons/MastheadSkeleton";
import { SkeletonBox } from "@/components/skeletons/SkeletonBox";
import { HomeHeroSkeleton } from "@/components/skeletons/HomeHeroSkeleton";
import { HomeYearSkeleton } from "@/components/skeletons/HomeYearSkeleton";

const CASUAL_TIERS = [
  { k: "易", href: "/play/easy" },
  { k: "中", href: "/play/medium" },
  { k: "難", href: "/play/hard" },
  { k: "極", href: "/play/expert", accent: true },
];

export default function Loading() {
  return (
    <>
      <MastheadSkeleton />
      <main className="px-6 lg:px-24 py-10 lg:py-16 max-w-[1480px] mx-auto">
        <div className="eyebrow red">—</div>
        <SkeletonBox className="h-3 w-64 mt-1" />

        {/* Hero band — placeholder */}
        <HomeHeroSkeleton />

        {/* Casual band — render real (it's static) */}
        <section className="mt-12 max-w-[640px] border-t border-sumi/20 pt-6">
          <div className="flex items-baseline justify-between mb-3.5">
            <div className="eyebrow">§ casual</div>
            <Link href="/play" className="ital text-vermillion text-[14px] hover:underline">
              see all →
            </Link>
          </div>
          <p className="ital text-moss text-[14px] mb-4">
            — pick a floor. Only the daily moves the streak.
          </p>
          <div className="grid grid-cols-4 border-[1.5px] border-sumi">
            {CASUAL_TIERS.map((t, i, arr) => (
              <Link
                key={t.k}
                href={t.href}
                className={
                  "p-4 flex items-center justify-center mincho font-semibold text-[36px] -tracking-[0.02em] transition-opacity hover:opacity-80 " +
                  (i < arr.length - 1 ? "border-r-[1.5px] border-sumi " : "") +
                  (t.accent ? "bg-vermillion text-bone" : "bg-bone text-sumi")
                }
              >
                {t.k}
              </Link>
            ))}
          </div>
        </section>

        {/* Year — placeholder */}
        <HomeYearSkeleton />

        {/* Bottom strip — placeholder */}
        <section className="mt-12 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <SkeletonBox className="h-[80px] w-full" />
          <SkeletonBox className="h-[160px] w-full mt-8 lg:mt-0" />
        </section>
      </main>
    </>
  );
}
