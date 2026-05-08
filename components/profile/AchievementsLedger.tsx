import { ACHIEVEMENTS, type AchievementStatus } from "@/lib/achievements";

interface Props {
  statuses: AchievementStatus[];
}

export function AchievementsLedger({ statuses }: Props) {
  const byKey = new Map(statuses.map((s) => [s.key, s]));

  return (
    <div className="border-t-[1.5px] border-sumi font-jakarta">
      <div className="grid grid-cols-[36px_32px_1.1fr_2fr_140px] gap-5 py-2.5 border-b border-sumi/30 mono text-[9.5px] tracking-[0.22em] uppercase text-moss">
        <div />
        <div />
        <div>mark</div>
        <div>condition</div>
        <div className="text-right">earned</div>
      </div>

      {ACHIEVEMENTS.map((a) => {
        const s = byKey.get(a.key);
        const earned = !!s?.earned;
        const hidden = !earned && a.hideUntilEarned;
        const rowOpacity = earned ? "" : hidden ? "opacity-40" : "opacity-55";
        const markCls = earned
          ? "bg-vermillion"
          : "bg-transparent border border-sumi/30";

        return (
          <div
            key={a.key}
            className={
              "grid grid-cols-[36px_32px_1.1fr_2fr_140px] gap-5 py-[18px] border-b border-sumi/12 items-baseline " +
              rowOpacity
            }
          >
            <div className="self-center justify-self-center">
              <div
                className={
                  "w-[6px] h-[6px] " + markCls + " -translate-y-[2px]"
                }
              />
            </div>

            <div className="mincho text-[24px] leading-none self-center text-sumi">
              {hidden ? (
                <span className="text-moss font-normal">？</span>
              ) : (
                <span className={earned ? "font-semibold" : "font-normal text-moss"}>
                  {a.glyph}
                </span>
              )}
            </div>

            <div className="mincho text-[18px] -tracking-[0.005em]">
              {hidden ? (
                <span className="text-moss font-normal">— hidden</span>
              ) : (
                <span className={earned ? "text-sumi font-medium" : "text-moss font-normal"}>
                  {a.name}
                </span>
              )}
            </div>

            <div className="ital text-[15.5px] text-moss leading-snug">
              {hidden ? "earn it to reveal." : a.desc}
            </div>

            <div className="mono text-[11px] tracking-[0.12em] uppercase text-right self-center">
              {earned ? (
                <span className="text-sumi">{s?.earnedAt ?? "—"}</span>
              ) : (
                <span className="text-moss">{s?.progress ?? "—"}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
