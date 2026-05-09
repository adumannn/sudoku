"use client";
import { useEffect, useRef, useState } from "react";
import { Seal } from "@/components/year-scroll/Seal";
import { SealPopover } from "@/components/year-scroll/SealPopover";
import type { SealEntry, YearSeries } from "@/lib/seal/types";

interface Props {
  series: YearSeries;
}

const MONTH_ABBR = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

const CELL_PX = 14;
const GAP_PX = 3;

export function YearScroll({ series }: Props) {
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<SealEntry | null>(null);

  useEffect(() => {
    const todayEl = todayRef.current;
    const container = scrollRef.current;
    if (!todayEl || !container) return;
    const target = todayEl.offsetLeft - container.clientWidth / 2 + todayEl.clientWidth / 2;
    container.scrollLeft = Math.max(0, target);
  }, []);

  const onSealClick = (e: SealEntry) => {
    if (e.state === "filled" || e.state === "freeze") setPopover(e);
  };

  // Bucket seals into weeks aligned to ISO Mon-start. Pad the front of week 0 if year doesn't start Monday.
  const cellsByWeek: (SealEntry | null)[][] = [];
  if (series.seals.length > 0) {
    const first = new Date(series.seals[0].date + "T00:00:00Z");
    const dow = (first.getUTCDay() + 6) % 7;
    let week: (SealEntry | null)[] = Array(dow).fill(null);
    for (const e of series.seals) {
      week.push(e);
      if (week.length === 7) {
        cellsByWeek.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      cellsByWeek.push(week);
    }
  }

  // Detect month boundaries: find the first non-null entry of each month and record its column.
  const monthMarkers: { weekIndex: number; abbr: string }[] = [];
  let lastMonth = -1;
  cellsByWeek.forEach((week, wi) => {
    for (const entry of week) {
      if (!entry) continue;
      const month = parseInt(entry.date.slice(5, 7), 10) - 1;
      if (month !== lastMonth) {
        monthMarkers.push({ weekIndex: wi, abbr: MONTH_ABBR[month] });
        lastMonth = month;
      }
      break;
    }
  });

  return (
    <div ref={scrollRef} className="overflow-x-auto pb-2 scroll-smooth">
      <div
        className="grid items-start"
        style={{
          gridTemplateColumns: `repeat(${cellsByWeek.length}, ${CELL_PX}px)`,
          gridTemplateRows: `auto repeat(7, ${CELL_PX}px)`,
          gap: `${GAP_PX}px`,
        }}
      >
        {monthMarkers.map((m) => (
          <div
            key={`m-${m.weekIndex}`}
            className="mono text-[9px] tracking-[0.18em] text-moss uppercase pb-1 whitespace-nowrap"
            style={{ gridColumn: m.weekIndex + 1, gridRow: 1 }}
          >
            {m.abbr}
          </div>
        ))}
        {cellsByWeek.map((week, wi) =>
          week.map((entry, di) => {
            if (!entry) return null;
            const isToday = entry.state === "today";
            return (
              <div
                key={entry.date}
                ref={isToday ? todayRef : undefined}
                style={{ gridColumn: wi + 1, gridRow: di + 2 }}
              >
                <Seal
                  kanji={entry.kanji}
                  state={entry.state}
                  size="xs"
                  onClick={
                    entry.state === "filled" || entry.state === "freeze"
                      ? () => onSealClick(entry)
                      : undefined
                  }
                  ariaLabel={`${entry.date} · ${entry.kanji}`}
                />
              </div>
            );
          }),
        )}
      </div>
      <SealPopover entry={popover} open={!!popover} onOpenChange={(o) => !o && setPopover(null)} />
    </div>
  );
}
