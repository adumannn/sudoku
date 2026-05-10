import Link from "next/link";
import { Heatmap } from "@/components/stats/Heatmap";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { formatTime } from "@/lib/utils";
import { fetchProfileData, formatSince } from "./_profile-data";

const STAMP_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const DIFFS = [
  { key: "easy", k: "易", lvl: "easy" },
  { key: "medium", k: "中", lvl: "medium" },
  { key: "hard", k: "難", lvl: "hard" },
  { key: "expert", k: "極", lvl: "expert" },
];

function numberWord(n: number): string {
  const words = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  ];
  return words[n] ?? n.toString();
}

export async function ProfileBody({
  userId,
  userCreatedAt,
}: {
  userId: string;
  userCreatedAt: string | null;
}) {
  const data = await fetchProfileData(userId, userCreatedAt);
  return (
    <>
      {/* Heatmap */}
      <div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2 mb-[18px]">
          <h2 className="mincho font-medium text-[26px] leading-none -tracking-[0.005em] text-sumi m-0">
            Half a year, in seals
            <span className="text-vermillion ml-2.5 text-[0.85em]">章</span>
          </h2>
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-moss text-right leading-relaxed">
            <strong className="text-sumi font-medium">{data.dailiesKept}</strong>{" "}
            kept ·{" "}
            <strong className="text-sumi font-medium">{data.missed}</strong>{" "}
            missed
            <br />
            last 26 weeks
          </div>
        </div>
        <div className="overflow-x-auto -mx-7 px-7 lg:mx-0 lg:px-0">
          <Heatmap days={data.heatmap} />
        </div>
        <div className="mt-3.5 flex justify-between items-center mono text-[9.5px] tracking-[0.18em] uppercase text-moss">
          <div>density = time on the puzzle</div>
          <div className="flex gap-1.5 items-center">
            <span>less</span>
            <span className="w-[11px] h-[11px] border-[0.5px] border-sumi/20" />
            <span className="w-[11px] h-[11px] bg-vermillion/22" />
            <span className="w-[11px] h-[11px] bg-vermillion/55" />
            <span className="w-[11px] h-[11px] bg-vermillion" />
            <span>more</span>
          </div>
        </div>
      </div>

      {/* Personal best */}
      <div>
        <div className="flex justify-between items-baseline mb-[18px] gap-6">
          <h3 className="mincho font-medium text-[26px] leading-none -tracking-[0.005em] text-sumi m-0">
            Personal best
            <span className="text-vermillion ml-2.5 text-[0.85em]">速</span>
          </h3>
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-moss text-right">
            your fastest, by floor
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-sumi/18">
          {DIFFS.map((d, i, arr) => {
            const stat = data.diffStats[d.key];
            const has = stat && stat.count > 0;
            return (
              <div
                key={d.key}
                className={
                  "py-5 px-5 border-b border-sumi/12 " +
                  (i === 0 ? "pl-0 " : "") +
                  (i < arr.length - 1 ? "border-r border-sumi/10 " : "")
                }
              >
                <div className="flex justify-between items-baseline">
                  <div
                    className={
                      "mincho font-semibold text-[32px] leading-none -tracking-[0.02em] " +
                      (has ? "text-sumi" : "text-moss/45")
                    }
                  >
                    {d.k}
                  </div>
                  <div className="mono text-[9.5px] tracking-[0.2em] uppercase text-moss">
                    {d.lvl}
                  </div>
                </div>
                <div
                  className={
                    "mincho font-semibold text-[32px] leading-none -tracking-[0.01em] tnum mt-5 " +
                    (has ? "text-vermillion" : "text-moss/50")
                  }
                >
                  {has ? formatTime(stat.best) : "—:—"}
                </div>
                <div className="mono text-[9.5px] tracking-[0.16em] uppercase text-moss mt-1.5">
                  {has && stat.bestGame
                    ? `${formatSince(stat.bestGame.created_at)} · ${stat.count} solved`
                    : "no solves yet"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Marks */}
      <div>
        <div className="flex justify-between items-baseline mb-[18px] gap-6">
          <h3 className="mincho font-medium text-[26px] leading-none -tracking-[0.005em] text-sumi m-0">
            {data.earnedCount === 0
              ? "No marks yet"
              : `${numberWord(data.earnedCount)} of twelve`}
            <span className="text-vermillion ml-2.5 text-[0.85em]">章</span>
          </h3>
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-moss text-right">
            {data.lastEarned ? (
              <>
                last earned{" "}
                <strong className="text-sumi font-medium">{data.lastEarned.glyph}</strong>{" "}
                · {data.lastEarned.when}
              </>
            ) : (
              <>{data.earnedCount} of 12 · earned</>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-6">
          {ACHIEVEMENTS.map((a) => {
            const s = data.statuses.find((x) => x.key === a.key);
            const earned = !!s?.earned;
            const hidden = !earned && a.hideUntilEarned;
            return (
              <div key={a.key} className="flex flex-col items-center gap-2.5">
                {earned ? (
                  <div
                    className="relative w-[54px] h-[54px] bg-vermillion text-bone flex items-center justify-center mincho font-bold leading-none"
                    style={{ fontSize: 26 }}
                  >
                    <span className="relative z-10">{a.glyph}</span>
                    <span
                      aria-hidden
                      className="absolute inset-0 mix-blend-multiply pointer-events-none"
                      style={{ backgroundImage: STAMP_NOISE }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-[54px] h-[54px] bg-transparent text-sumi flex items-center justify-center mincho font-semibold leading-none border-[1.5px] border-sumi/18"
                    style={{ fontSize: 26 }}
                  >
                    <span className="opacity-[0.22]">{hidden ? "？" : a.glyph}</span>
                  </div>
                )}
                <div
                  className={
                    "mincho font-semibold text-[11px] text-center leading-tight " +
                    (earned ? "text-sumi" : "text-moss")
                  }
                >
                  {hidden ? "— hidden" : a.name}
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-sumi/18 pt-3.5 mt-[18px] flex justify-between items-center mono text-[10px] tracking-[0.22em] uppercase text-moss">
          <span>
            {data.earnedCount} of 12
            {data.rareCount > 0 && <> · {data.rareCount} rare</>}
          </span>
          <Link href="/achievements" className="text-sumi border-b-[1.5px] border-vermillion pb-0.5">
            See the full ledger →
          </Link>
        </div>
      </div>
    </>
  );
}
