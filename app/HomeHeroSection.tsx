import { TodayCard } from "@/components/year-scroll/TodayCard";
import { YouTodayPanel } from "@/components/stats/YouTodayPanel";
import { weekdayJp } from "@/lib/kanji";
import { fetchHomeYearData } from "./_home-year-data";

interface HomeHeroSectionProps {
  userId: string;
  today: string;
  year: number;
  todaySeal: {
    date: string;
    kanji: string;
    romaji: string;
    meaning: string;
    senseiLine: string | null;
    sealKanji: string;
  } | null;
  todayRank: { rank: number; total: number } | null;
}

export async function HomeHeroSection({
  userId,
  today,
  year,
  todaySeal,
  todayRank,
}: HomeHeroSectionProps) {
  const data = await fetchHomeYearData(userId, today, year);
  return (
    <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] lg:gap-12 items-start">
      <TodayCard
        today={todaySeal}
        completedElapsed={data.completedTodayElapsed}
        freezePrompt={data.freezePrompt}
        tategakiDay={weekdayJp()}
      />
      <div className="mt-8 lg:mt-0">
        <YouTodayPanel
          streak={data.streak}
          yearFilled={data.yearFilled}
          yearTotal={data.yearTotal}
          todayElapsed={data.completedTodayElapsed ?? null}
          todayRank={todayRank}
        />
      </div>
    </section>
  );
}
