import type { HeatDay } from "@/lib/stats/heatmap";

const COLORS: Record<HeatDay["level"], string> = {
  0: "transparent",
  1: "hsl(var(--moss) / 0.35)",
  2: "hsl(var(--vermillion) / 0.55)",
  3: "hsl(var(--vermillion))",
};

export function Heatmap({ days }: { days: HeatDay[] }) {
  // 26 weeks × 7 days = 182 cells; columns are weeks (oldest left), rows are weekdays.
  const weeks: HeatDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
    >
      {weeks.map((wk, w) => (
        <div key={w} className="grid grid-rows-7 gap-1">
          {wk.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className="aspect-square"
              style={{
                background: COLORS[day.level],
                border:
                  day.level === 0
                    ? "0.5px solid hsl(var(--sumi) / 0.18)"
                    : "0.5px solid transparent",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
