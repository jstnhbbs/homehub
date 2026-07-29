export function napDurationMinutes(
  startedAt: Date,
  endedAt: Date | null,
  now: Date = new Date(),
): number {
  const end = endedAt ?? now;
  return Math.max(0, Math.floor((end.getTime() - startedAt.getTime()) / 60_000));
}

export function formatNapDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function totalNapMinutes(
  naps: Array<{ startedAt: Date; endedAt: Date | null }>,
  now: Date = new Date(),
): number {
  return naps.reduce(
    (total, nap) => total + napDurationMinutes(nap.startedAt, nap.endedAt, now),
    0,
  );
}

export function formatChildTodayNapSummary(
  naps: Array<{ localDate: string; startedAt: Date; endedAt: Date | null }>,
  localDate: string,
  now: Date = new Date(),
  options?: { isActive?: boolean },
): string {
  const todayNaps = naps.filter((nap) => nap.localDate === localDate);
  if (todayNaps.length === 0) return "No naps logged today";

  const count = todayNaps.length;
  const totalMinutes = totalNapMinutes(todayNaps, now);
  const parts = [
    `${count} nap${count === 1 ? "" : "s"}`,
    `${formatNapDuration(totalMinutes)} total`,
  ];

  if (!options?.isActive) {
    const lastEnded = todayNaps
      .map((nap) => nap.endedAt)
      .filter((value): value is Date => value != null)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (lastEnded) {
      const awakeMinutes = Math.max(
        0,
        Math.floor((now.getTime() - lastEnded.getTime()) / 60_000),
      );
      parts.push(`Awake ${formatNapDuration(awakeMinutes)}`);
    }
  }

  return parts.join(" · ");
}
