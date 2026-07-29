import { describe, expect, it } from "vitest";
import { fromZonedTime } from "date-fns-tz";
import {
  addLocalDays,
  parseLocalDateTimeInput,
  toLocalDateTimeInput,
} from "./datetime";

describe("nap datetime helpers", () => {
  it("round-trips a local datetime in a household timezone", () => {
    const timezone = "America/Chicago";
    const value = fromZonedTime("2026-07-28T13:30:00", timezone);
    expect(toLocalDateTimeInput(value, timezone)).toBe("2026-07-28T13:30");
    expect(parseLocalDateTimeInput("2026-07-28T13:30", timezone).toISOString()).toBe(
      value.toISOString(),
    );
  });

  it("adds local days in a household timezone", () => {
    expect(addLocalDays("2026-07-28", "America/Chicago", -1)).toBe("2026-07-27");
    expect(addLocalDays("2026-07-28", "America/Chicago", 1)).toBe("2026-07-29");
  });
});
