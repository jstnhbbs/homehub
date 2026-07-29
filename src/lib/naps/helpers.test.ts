import { describe, expect, it } from "vitest";
import {
  childWeekNapStats,
  formatAverageNapCount,
  formatChildDaySummary,
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

describe("formatChildDaySummary", () => {
  it("returns no naps when empty", () => {
    expect(formatChildDaySummary(0, 0)).toBe("No naps");
  });

  it("summarizes nap count and duration", () => {
    expect(formatChildDaySummary(2, 95)).toBe("2 naps · 1h 35m total");
  });
});

describe("formatAverageNapCount", () => {
  it("formats whole numbers without decimals", () => {
    expect(formatAverageNapCount(2)).toBe("2");
  });

  it("formats fractional averages to one decimal", () => {
    expect(formatAverageNapCount(1.666666)).toBe("1.7");
  });
});

describe("childWeekNapStats", () => {
  it("computes weekly totals and averages through today", () => {
    const naps = [
      {
        profileId: "child-1",
        localDate: "2026-07-28",
        startedAt: new Date("2026-07-28T13:00:00.000Z"),
        endedAt: new Date("2026-07-28T14:00:00.000Z"),
      },
      {
        profileId: "child-1",
        localDate: "2026-07-28",
        startedAt: new Date("2026-07-28T15:00:00.000Z"),
        endedAt: new Date("2026-07-28T15:30:00.000Z"),
      },
      {
        profileId: "child-1",
        localDate: "2026-07-27",
        startedAt: new Date("2026-07-27T13:00:00.000Z"),
        endedAt: new Date("2026-07-27T14:30:00.000Z"),
      },
    ];

    const stats = childWeekNapStats(
      naps,
      "child-1",
      ["2026-07-27", "2026-07-28", "2026-07-29"],
      "2026-07-28",
    );

    expect(stats.totalNaps).toBe(3);
    expect(stats.totalMinutes).toBe(180);
    expect(stats.elapsedDays).toBe(2);
    expect(stats.avgNapsPerDay).toBe(1.5);
    expect(stats.avgMinutesPerDay).toBe(90);
  });
});
