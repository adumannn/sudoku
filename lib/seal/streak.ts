const MAX_WALKBACK = 730;

/**
 * Walks back from `today`, counting consecutive dates present in either
 * `completed` or `frozen`. If today itself isn't present, starts the walk
 * at yesterday so an unfinished today does not break the streak.
 *
 * Pure / no I/O.
 */
export function computeUnifiedStreak(
  today: string,
  completed: Set<string>,
  frozen: Set<string>,
): number {
  const present = (d: string) => completed.has(d) || frozen.has(d);

  let n = 0;
  let cursor = today;
  if (present(cursor)) {
    n++;
    cursor = prevDay(cursor);
  } else {
    cursor = prevDay(cursor);
  }
  // MAX_WALKBACK caps total streak; if today was counted we have 1 already
  const remaining = MAX_WALKBACK - n;
  for (let i = 0; i < remaining && present(cursor); i++) {
    n++;
    cursor = prevDay(cursor);
  }
  return n;
}

function prevDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
