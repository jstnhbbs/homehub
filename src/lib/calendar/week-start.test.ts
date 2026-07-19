import { describe, expect, it } from "vitest";
import {
  parseWeekStartsOn,
  weekdayLabels,
} from "@/lib/calendar/week-start";

describe("week start", () => {
  it("parses valid week start days", () => {
    expect(parseWeekStartsOn("0")).toBe(0);
    expect(parseWeekStartsOn("1")).toBe(1);
    expect(parseWeekStartsOn("invalid")).toBe(1);
  });

  it("orders weekday labels from the chosen start day", () => {
    expect(weekdayLabels(1)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(weekdayLabels(0)).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
  });
});
