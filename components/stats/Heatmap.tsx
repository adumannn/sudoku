"use client";
/**
 * 26-week × 7-day heatmap. Renders deterministic-looking activity tiles —
 * recent weeks are denser. The actual data wiring is left for a follow-up;
 * for now we generate from a seeded RNG so the visual stays stable.
 */
export function Heatmap({ weeks = 26, seed = 7 }: { weeks?: number; seed?: number }) {
  let s = seed;
  const rng = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const colors = [
    "transparent",
    "hsl(var(--vermillion) / 0.18)",
    "hsl(var(--vermillion) / 0.55)",
    "hsl(var(--vermillion))",
  ];
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: weeks }, (_, w) => {
        const recency = w / weeks;
        return (
          <div key={w} className="grid grid-rows-7 gap-1">
            {Array.from({ length: 7 }, (_, d) => {
              const r = rng();
              let v: 0 | 1 | 2 | 3;
              if (r < 0.05 - recency * 0.04) v = 0;
              else if (r < 0.18) v = 1;
              else if (r < 0.45) v = 2;
              else v = 3;
              return (
                <div
                  key={d}
                  className="aspect-square"
                  style={{
                    background: v === 0 ? "transparent" : colors[v],
                    border:
                      v === 0
                        ? "0.5px solid hsl(var(--sumi) / 0.18)"
                        : "0.5px solid transparent",
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
