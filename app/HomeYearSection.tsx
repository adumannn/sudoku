import { YearScroll } from "@/components/year-scroll/YearScroll";
import { fetchHomeYearData } from "./_home-year-data";

interface HomeYearSectionProps {
  userId: string;
  today: string;
  year: number;
}

export async function HomeYearSection({ userId, today, year }: HomeYearSectionProps) {
  const data = await fetchHomeYearData(userId, today, year);
  return (
    <section className="mt-12">
      <div className="flex justify-between items-baseline mb-3">
        <div className="eyebrow">your year</div>
        <div className="mono text-[11px] tracking-[0.14em] text-moss">
          {data.yearFilled}
          {" / "}
          {data.yearTotal}
        </div>
      </div>
      <YearScroll series={data.series} />
    </section>
  );
}
