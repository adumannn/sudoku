"use client";
import { useEffect, useRef, useState } from "react";
import { Seal } from "@/components/year-scroll/Seal";
import { SealPopover } from "@/components/year-scroll/SealPopover";
import type { SealEntry, YearSeries } from "@/lib/seal/types";

interface Props {
  series: YearSeries;
  /** Variant for embed contexts. 'home' caps height; 'full' expands. */
  variant?: "home" | "full";
}

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"]; // Mon..Sun

export function YearScroll({ series, variant = "home" }: Props) {
  const todayRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<SealEntry | null>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const onSealClick = (e: SealEntry) => {
    if (e.state === "filled" || e.state === "freeze") setPopover(e);
  };

  const cellsByWeek: SealEntry[][] = [];
  // Bucket seals into weeks aligned to ISO Mon-start. Pad the front of week 0 if year doesn't start Monday.
  if (series.seals.length > 0) {
    const first = new Date(series.seals[0].date + "T00:00:00Z");
    const dow = (first.getUTCDay() + 6) % 7; // 0..6 (Mon..Sun)
    let week: SealEntry[] = Array(dow).fill(null) as any[];
    for (const e of series.seals) {
      week.push(e);
      if (week.length === 7) {
        cellsByWeek.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null as any);
      cellsByWeek.push(week);
    }
  }

  return (
    <div
      className={
        variant === "home"
          ? "max-h-[440px] overflow-y-auto pr-2"
          : "h-full overflow-y-auto pr-2"
      }
    >
      <div
        className="grid items-start gap-1"
        style={{ gridTemplateColumns: "36px repeat(7, 1fr)" }}
      >
        <div />
        {WEEKDAY_HEADERS.map((h) => (
          <div
            key={h}
            className="mincho text-[10px] text-moss text-center pb-1"
          >
            {h}
          </div>
        ))}
        {cellsByWeek.map((week, wi) => (
          <Row
            key={wi}
            week={week}
            weekNumber={wi + 1}
            onClick={onSealClick}
            todayRef={todayRef}
          />
        ))}
      </div>
      <SealPopover entry={popover} open={!!popover} onOpenChange={(o) => !o && setPopover(null)} />
    </div>
  );
}

function Row({
  week,
  weekNumber,
  onClick,
  todayRef,
}: {
  week: SealEntry[];
  weekNumber: number;
  onClick: (e: SealEntry) => void;
  todayRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      <div className="mono text-[9px] text-moss/60 self-center text-right pr-1">
        {weekNumber % 4 === 1 ? `w${weekNumber.toString().padStart(2, "0")}` : ""}
      </div>
      {week.map((entry, di) => {
        if (!entry) return <div key={di} aria-hidden />;
        const isToday = entry.state === "today";
        return (
          <div key={entry.date} ref={isToday ? todayRef : undefined}>
            <Seal
              kanji={entry.kanji}
              state={entry.state}
              size="sm"
              onClick={
                entry.state === "filled" || entry.state === "freeze"
                  ? () => onClick(entry)
                  : undefined
              }
              ariaLabel={`${entry.date} · ${entry.kanji}`}
            />
          </div>
        );
      })}
    </>
  );
}
