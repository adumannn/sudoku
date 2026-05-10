import { YearScroll } from "@/components/year-scroll/YearScroll";
import { fetchYearPageData } from "./_year-data";

interface YearScrollOnlyProps {
  userId: string;
  today: string;
  year: number;
}

export async function YearScrollOnly({ userId, today, year }: YearScrollOnlyProps) {
  const { series } = await fetchYearPageData(userId, today, year);

  return (
    <section className="mt-10 lg:mt-14 relative">
      <div
        aria-hidden
        className="watermark-kanji"
        style={{ fontSize: "320px", right: "-40px", top: "-60px" }}
      >
        年
      </div>
      <YearScroll series={series} cellPx={40} gapPx={5} sealSize="md" showWeekdayRail />
      <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 mono text-[10px] tracking-[0.22em] uppercase text-moss">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 border border-sumi/[0.32] bg-sumi/[0.03]" />
          stamped
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-[1.5px] border-vermillion/70" />
          today
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 border border-dashed border-sumi/[0.16]" />
          missed
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 border border-dashed border-vermillion/40 bg-sumi/[0.03]" />
          frozen
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 border border-sumi/[0.07]" />
          future
        </span>
      </div>
    </section>
  );
}
