import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function addLocalDays(localDate: string, timezone: string, days: number) {
  const date = fromZonedTime(`${localDate}T12:00:00`, timezone);
  return formatInTimeZone(addDays(date, days), timezone, "yyyy-MM-dd");
}

export function toLocalDateTimeInput(value: Date, timezone: string) {
  return formatInTimeZone(value, timezone, "yyyy-MM-dd'T'HH:mm");
}

export function parseLocalDateTimeInput(value: string, timezone: string) {
  return fromZonedTime(value, timezone);
}

export function defaultManualStartInput(timezone: string) {
  return toLocalDateTimeInput(new Date(), timezone);
}
