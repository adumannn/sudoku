import { MastheadSkeleton } from "@/components/skeletons/MastheadSkeleton";
import { SkeletonBox } from "@/components/skeletons/SkeletonBox";

function CardSkeleton() {
  return (
    <div className="border border-sumi/15 p-5 space-y-3">
      <SkeletonBox className="h-[140px] w-full" />
      <SkeletonBox className="h-4 w-2/3" />
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-9 w-28 mt-2" />
    </div>
  );
}

function CardGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-bone">
      <MastheadSkeleton />
      <div className="max-w-[960px] mx-auto px-6 md:px-10 pt-10 pb-20">
        <header className="mb-12">
          <div className="eyebrow red">巻 · back issues &amp; editions</div>
          <SkeletonBox className="h-[64px] w-1/2 mt-2" />
          <div className="mt-3 space-y-2">
            <SkeletonBox className="h-3 w-full max-w-[560px]" />
            <SkeletonBox className="h-3 w-2/3 max-w-[560px]" />
          </div>
        </header>
        <section className="mb-16">
          <h2 className="mincho text-[20px] text-sumi mb-6">Seasonal volumes · 季</h2>
          <CardGrid count={6} />
        </section>
        <section className="mb-16">
          <h2 className="mincho text-[20px] text-sumi mb-6">Premium editions · 別</h2>
          <CardGrid count={3} />
        </section>
      </div>
    </main>
  );
}
