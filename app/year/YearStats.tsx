import { fetchYearPageData } from "./_year-data";

interface YearStatsProps {
  userId: string;
  today: string;
  year: number;
}

export async function YearStats({ userId, today, year }: YearStatsProps) {
  const { stamped, total, streak, percent } = await fetchYearPageData(userId, today, year);

  return (
    <dl className="grid grid-cols-3 gap-x-10 gap-y-2 self-end">
      <div>
        <dt className="mono text-[10px] tracking-[0.22em] uppercase text-moss">stamped</dt>
        <dd className="kdate-jp text-[36px] tnum leading-none mt-1">
          {stamped}
          <span className="text-moss text-[16px] font-normal"> / {total}</span>
        </dd>
      </div>
      <div>
        <dt className="mono text-[10px] tracking-[0.22em] uppercase text-moss">streak</dt>
        <dd className="kdate-jp text-[36px] tnum leading-none mt-1 text-vermillion">
          {streak}<span className="text-[16px]">d</span>
        </dd>
      </div>
      <div>
        <dt className="mono text-[10px] tracking-[0.22em] uppercase text-moss">filled</dt>
        <dd className="kdate-jp text-[36px] tnum leading-none mt-1">
          {percent}<span className="text-[16px]">%</span>
        </dd>
      </div>
    </dl>
  );
}
