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
