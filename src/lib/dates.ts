import { addDays, format, getISOWeek, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function localDateIn(timezone: string, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function weekDates(from = new Date()) {
  const start = startOfWeek(from, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function weekKey(date = new Date()) {
  return `${format(date, "RRRR")}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export function formatLocalDate(
  localDate: string,
  timezone: string,
  pattern: string,
) {
  return formatInTimeZone(
    fromZonedTime(`${localDate}T12:00:00`, timezone),
    timezone,
    pattern,
  );
}
