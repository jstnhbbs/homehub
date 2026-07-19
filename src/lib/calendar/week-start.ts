import type { Day } from "date-fns";

export const WEEK_START_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const satisfies ReadonlyArray<{ value: Day; label: string }>;

export const DEFAULT_WEEK_STARTS_ON: Day = 1;

export function parseWeekStartsOn(value: unknown): Day {
  const day = Number(value);
  if (WEEK_START_OPTIONS.some((option) => option.value === day)) {
    return day as Day;
  }
  return DEFAULT_WEEK_STARTS_ON;
}

export function weekdayLabels(weekStartsOn: Day) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return [...labels.slice(weekStartsOn), ...labels.slice(0, weekStartsOn)];
}
