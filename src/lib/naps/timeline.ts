import { formatInTimeZone } from "date-fns-tz";
import type { SleepKind } from "@/db/schema";
import { formatSleepDuration, napDurationMinutes } from "@/lib/naps/helpers";
import { localDayBounds, sleepOverlapsLocalDate } from "@/lib/naps/overlap";

export const DEFAULT_TIMELINE_START_HOUR = 5;
export const DEFAULT_TIMELINE_END_HOUR = 23;

export type SleepTimelineBar = {
  napId: string;
  kind: SleepKind;
  leftPercent: number;
  widthPercent: number;
  startedAt: Date;
  endedAt: Date | null;
  timeLabel: string;
  durationLabel: string;
};

/** @deprecated Use SleepTimelineBar */
export type NapTimelineBar = SleepTimelineBar;

export type AwakeGap = {
  leftPercent: number;
  widthPercent: number;
  minutes: number;
  label: string;
};

export type HeatmapBlock = {
  startHour: number;
  endHour: number;
  label: string;
};

export const HEATMAP_BLOCKS: HeatmapBlock[] = [
  { startHour: 5, endHour: 8, label: "5–8a" },
  { startHour: 8, endHour: 11, label: "8–11a" },
  { startHour: 11, endHour: 14, label: "11–2p" },
  { startHour: 14, endHour: 17, label: "2–5p" },
  { startHour: 17, endHour: 20, label: "5–8p" },
  { startHour: 20, endHour: 23, label: "8–11p" },
];

export function localDateOf(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

export function minutesOnLocalDate(date: Date, localDate: string, timezone: string) {
  if (localDateOf(date, timezone) !== localDate) return null;
  const hour = Number(formatInTimeZone(date, timezone, "H"));
  const minute = Number(formatInTimeZone(date, timezone, "m"));
  return hour * 60 + minute;
}

export function timelineHourLabels(
  startHour = DEFAULT_TIMELINE_START_HOUR,
  endHour = DEFAULT_TIMELINE_END_HOUR,
) {
  const labels: string[] = [];
  for (let hour = startHour; hour <= endHour; hour += 3) {
    if (hour === 0) labels.push("12a");
    else if (hour < 12) labels.push(`${hour}a`);
    else if (hour === 12) labels.push("12p");
    else labels.push(`${hour - 12}p`);
  }
  return labels;
}

function timelineRangeStart(startHour: number) {
  return startHour * 60;
}

function timelineRangeEnd(endHour: number) {
  return endHour * 60;
}

function clampMinutes(minutes: number, startHour: number, endHour: number) {
  return Math.max(timelineRangeStart(startHour), Math.min(timelineRangeEnd(endHour), minutes));
}

export function toTimelinePercents(
  startMinutes: number,
  endMinutes: number,
  startHour = DEFAULT_TIMELINE_START_HOUR,
  endHour = DEFAULT_TIMELINE_END_HOUR,
) {
  const rangeStart = timelineRangeStart(startHour);
  const rangeDuration = timelineRangeEnd(endHour) - rangeStart;
  const clampedStart = clampMinutes(startMinutes, startHour, endHour);
  const clampedEnd = Math.max(clampedStart, clampMinutes(endMinutes, startHour, endHour));
  const leftPercent = ((clampedStart - rangeStart) / rangeDuration) * 100;
  const widthPercent = ((clampedEnd - clampedStart) / rangeDuration) * 100;
  return { leftPercent, widthPercent: Math.max(widthPercent, 1.5) };
}

function overlapMinutesOnLocalDate<
  T extends { localDate: string; startedAt: Date; endedAt: Date | null },
>(
  log: T,
  localDate: string,
  timezone: string,
  now: Date,
  startHour: number,
  endHour: number,
) {
  if (!sleepOverlapsLocalDate(log, localDate, timezone, now)) return null;

  const { start: dayStart, end: dayEnd } = localDayBounds(localDate, timezone);
  const sleepEnd = log.endedAt ?? now;
  const overlapStart = new Date(Math.max(log.startedAt.getTime(), dayStart.getTime()));
  const overlapEnd = new Date(Math.min(sleepEnd.getTime(), dayEnd.getTime()));
  if (overlapStart >= overlapEnd) return null;

  const startMinutes = minutesOnLocalDate(overlapStart, localDate, timezone);
  let endMinutes = minutesOnLocalDate(overlapEnd, localDate, timezone);

  if (startMinutes == null) {
    return null;
  }

  if (endMinutes == null) {
    endMinutes = timelineRangeEnd(endHour);
  }

  if (endMinutes <= startMinutes) {
    return null;
  }

  return { startMinutes, endMinutes, overlapStart, overlapEnd };
}

export function buildDayTimelineBars<
  T extends {
    id: string;
    kind?: SleepKind;
    localDate: string;
    startedAt: Date;
    endedAt: Date | null;
  },
>(
  logs: T[],
  localDate: string,
  timezone: string,
  now: Date = new Date(),
  startHour = DEFAULT_TIMELINE_START_HOUR,
  endHour = DEFAULT_TIMELINE_END_HOUR,
): SleepTimelineBar[] {
  return logs
    .filter((log) => sleepOverlapsLocalDate(log, localDate, timezone, now))
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
    .flatMap((log) => {
      const overlap = overlapMinutesOnLocalDate(
        log,
        localDate,
        timezone,
        now,
        startHour,
        endHour,
      );
      if (!overlap) return [];

      const { leftPercent, widthPercent } = toTimelinePercents(
        overlap.startMinutes,
        overlap.endMinutes,
        startHour,
        endHour,
      );
      const endLabel = log.endedAt
        ? formatInTimeZone(log.endedAt, timezone, "h:mm a")
        : "Now";
      const kind = log.kind ?? "nap";

      return [
        {
          napId: log.id,
          kind,
          leftPercent,
          widthPercent,
          startedAt: log.startedAt,
          endedAt: log.endedAt,
          timeLabel: `${formatInTimeZone(log.startedAt, timezone, "h:mm a")} – ${endLabel}`,
          durationLabel:
            kind === "night"
              ? `Night · ${formatSleepDuration(napDurationMinutes(log.startedAt, log.endedAt, now))}`
              : formatSleepDuration(napDurationMinutes(log.startedAt, log.endedAt, now)),
        },
      ];
    });
}

export function buildAwakeGaps<
  T extends {
    kind?: SleepKind;
    localDate: string;
    startedAt: Date;
    endedAt: Date | null;
  },
>(
  logs: T[],
  localDate: string,
  timezone: string,
  startHour = DEFAULT_TIMELINE_START_HOUR,
  endHour = DEFAULT_TIMELINE_END_HOUR,
) {
  const sorted = logs
    .filter(
      (log) => sleepOverlapsLocalDate(log, localDate, timezone) && log.endedAt,
    )
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

  const gaps: AwakeGap[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const previousEnd = previous.endedAt!;
    const gapMinutes = Math.max(
      0,
      Math.floor((current.startedAt.getTime() - previousEnd.getTime()) / 60_000),
    );
    if (gapMinutes < 5) continue;

    const gapStartMinutes = minutesOnLocalDate(previousEnd, localDate, timezone);
    const gapEndMinutes = minutesOnLocalDate(current.startedAt, localDate, timezone);
    if (gapStartMinutes == null || gapEndMinutes == null) continue;

    const { leftPercent, widthPercent } = toTimelinePercents(
      gapStartMinutes,
      gapEndMinutes,
      startHour,
      endHour,
    );

    gaps.push({
      leftPercent,
      widthPercent,
      minutes: gapMinutes,
      label: `Awake ${formatSleepDuration(gapMinutes)}`,
    });
  }

  return gaps;
}

export function napOverlapsHeatmapBlock<
  T extends {
    localDate: string;
    startedAt: Date;
    endedAt: Date | null;
  },
>(
  log: T,
  localDate: string,
  timezone: string,
  block: HeatmapBlock,
  now: Date = new Date(),
) {
  if (!sleepOverlapsLocalDate(log, localDate, timezone, now)) return false;

  const { start: dayStart, end: dayEnd } = localDayBounds(localDate, timezone);
  const sleepEnd = log.endedAt ?? now;
  const overlapStart = new Date(Math.max(log.startedAt.getTime(), dayStart.getTime()));
  const overlapEnd = new Date(Math.min(sleepEnd.getTime(), dayEnd.getTime()));
  if (overlapStart >= overlapEnd) return false;

  const startMinutes = minutesOnLocalDate(overlapStart, localDate, timezone);
  let endMinutes = minutesOnLocalDate(overlapEnd, localDate, timezone);
  if (startMinutes == null) return false;
  if (endMinutes == null) endMinutes = block.endHour * 60;

  const blockStart = block.startHour * 60;
  const blockEnd = block.endHour * 60;
  return startMinutes < blockEnd && endMinutes > blockStart;
}
