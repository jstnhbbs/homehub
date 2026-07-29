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

export type ChildDayNapStats = {
  localDate: string;
  napCount: number;
  totalMinutes: number;
};

export type ChildWeekNapStats = {
  profileId: string;
  days: ChildDayNapStats[];
  totalNaps: number;
  totalMinutes: number;
  avgNapsPerDay: number;
  avgMinutesPerDay: number;
  elapsedDays: number;
};

export function childNapsForDate<
  T extends { profileId: string; localDate: string },
>(naps: T[], profileId: string, localDate: string) {
  return naps.filter(
    (nap) => nap.profileId === profileId && nap.localDate === localDate,
  );
}

export function dayNapStats<
  T extends { startedAt: Date; endedAt: Date | null },
>(naps: T[], now: Date = new Date()) {
  return {
    napCount: naps.length,
    totalMinutes: totalNapMinutes(naps, now),
  };
}

export function childDayNapStats<
  T extends {
    profileId: string;
    localDate: string;
    startedAt: Date;
    endedAt: Date | null;
  },
>(
  naps: T[],
  profileId: string,
  localDate: string,
  now: Date = new Date(),
): ChildDayNapStats {
  const dayNaps = childNapsForDate(naps, profileId, localDate);
  return {
    localDate,
    ...dayNapStats(dayNaps, now),
  };
}

export function childWeekNapStats<
  T extends {
    profileId: string;
    localDate: string;
    startedAt: Date;
    endedAt: Date | null;
  },
>(
  naps: T[],
  profileId: string,
  weekDates: string[],
  todayLocalDate: string,
  now: Date = new Date(),
): ChildWeekNapStats {
  const days = weekDates.map((localDate) =>
    childDayNapStats(
      naps,
      profileId,
      localDate,
      localDate === todayLocalDate ? now : now,
    ),
  );
  const elapsedDays = weekDates.filter((date) => date <= todayLocalDate).length;
  const totalNaps = days.reduce((sum, day) => sum + day.napCount, 0);
  const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);

  return {
    profileId,
    days,
    totalNaps,
    totalMinutes,
    avgNapsPerDay: elapsedDays ? totalNaps / elapsedDays : 0,
    avgMinutesPerDay: elapsedDays ? totalMinutes / elapsedDays : 0,
    elapsedDays,
  };
}

export function formatChildDaySummary(napCount: number, totalMinutes: number) {
  if (napCount === 0) return "No naps";
  return `${napCount} nap${napCount === 1 ? "" : "s"} · ${formatNapDuration(totalMinutes)} total`;
}

export function formatAverageNapCount(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
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
