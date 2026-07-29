import { describe, expect, it } from "vitest";
import {
  formatChildTodayNapSummary,
  napDurationMinutes,
} from "./helpers";

describe("napDurationMinutes", () => {
  it("counts minutes for a finished nap", () => {
    const startedAt = new Date("2026-07-28T13:00:00.000Z");
    const endedAt = new Date("2026-07-28T13:47:00.000Z");
    expect(napDurationMinutes(startedAt, endedAt)).toBe(47);
  });

  it("uses now for an active nap", () => {
    const startedAt = new Date("2026-07-28T13:00:00.000Z");
    const now = new Date("2026-07-28T13:30:00.000Z");
    expect(napDurationMinutes(startedAt, null, now)).toBe(30);
  });
});

describe("formatChildTodayNapSummary", () => {
  it("summarizes completed naps and awake time", () => {
    const now = new Date("2026-07-28T16:00:00.000Z");
    const summary = formatChildTodayNapSummary(
      [
        {
          localDate: "2026-07-28",
          startedAt: new Date("2026-07-28T13:00:00.000Z"),
          endedAt: new Date("2026-07-28T14:00:00.000Z"),
        },
        {
          localDate: "2026-07-28",
          startedAt: new Date("2026-07-28T14:30:00.000Z"),
          endedAt: new Date("2026-07-28T15:00:00.000Z"),
        },
      ],
      "2026-07-28",
      now,
    );
    expect(summary).toBe("2 naps · 1h 30m total · Awake 1h");
  });
});
