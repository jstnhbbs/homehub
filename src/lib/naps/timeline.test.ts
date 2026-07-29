import { describe, expect, it } from "vitest";
import {
  buildAwakeGaps,
  buildDayTimelineBars,
  HEATMAP_BLOCKS,
  napOverlapsHeatmapBlock,
  toTimelinePercents,
} from "./timeline";

describe("toTimelinePercents", () => {
  it("maps minutes into percentage positions", () => {
    const result = toTimelinePercents(8 * 60, 10 * 60, 5, 21);
    expect(result.leftPercent).toBeCloseTo(((8 - 5) / 16) * 100);
    expect(result.widthPercent).toBeCloseTo((2 / 16) * 100);
  });
});

describe("buildDayTimelineBars", () => {
  it("builds positioned bars for naps on a day", () => {
    const bars = buildDayTimelineBars(
      [
        {
          id: "nap-1",
          localDate: "2026-07-28",
          startedAt: new Date("2026-07-28T14:00:00.000Z"),
          endedAt: new Date("2026-07-28T15:00:00.000Z"),
        },
      ],
      "2026-07-28",
      "UTC",
      new Date("2026-07-28T16:00:00.000Z"),
    );

    expect(bars).toHaveLength(1);
    expect(bars[0]?.timeLabel).toContain("2:00 PM");
    expect(bars[0]?.durationLabel).toBe("1h");
  });
});

describe("buildAwakeGaps", () => {
  it("labels awake windows between completed naps", () => {
    const gaps = buildAwakeGaps(
      [
        {
          localDate: "2026-07-28",
          startedAt: new Date("2026-07-28T13:00:00.000Z"),
          endedAt: new Date("2026-07-28T14:00:00.000Z"),
        },
        {
          localDate: "2026-07-28",
          startedAt: new Date("2026-07-28T15:00:00.000Z"),
          endedAt: new Date("2026-07-28T15:30:00.000Z"),
        },
      ],
      "2026-07-28",
      "UTC",
    );

    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.label).toBe("Awake 1h");
  });
});

describe("napOverlapsHeatmapBlock", () => {
  it("detects overlap between a nap and a heatmap block", () => {
    const overlaps = napOverlapsHeatmapBlock(
      {
        localDate: "2026-07-28",
        startedAt: new Date("2026-07-28T14:00:00.000Z"),
        endedAt: new Date("2026-07-28T15:00:00.000Z"),
      },
      "2026-07-28",
      "UTC",
      HEATMAP_BLOCKS[3]!,
    );

    expect(overlaps).toBe(true);
  });
});
