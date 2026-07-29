import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function toLocalDateTimeInput(value: Date, timezone: string) {
  return formatInTimeZone(value, timezone, "yyyy-MM-dd'T'HH:mm");
}

export function parseLocalDateTimeInput(value: string, timezone: string) {
  return fromZonedTime(value, timezone);
}

export function defaultManualStartInput(timezone: string) {
  return toLocalDateTimeInput(new Date(), timezone);
}
