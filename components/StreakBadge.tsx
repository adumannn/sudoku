export function StreakBadge({ days }: { days: number }) {
  return (
    <span className="mincho tabular-nums text-vermillion">
      {days}
      <span className="text-[0.6em] ml-[0.05em] align-baseline">日</span>
    </span>
  );
}
