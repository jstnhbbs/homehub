import { describe, expect, it } from "vitest";
import { sleepOverlapsLocalDate } from "./overlap";

describe("sleepOverlapsLocalDate", () => {
  it("matches overnight sleep on both bed and wake days", () => {
    const log = {
      kind: "night" as const,
      localDate: "2026-07-29",
      startedAt: new Date("2026-07-28T23:30:00.000Z"),
      endedAt: new Date("2026-07-29T11:00:00.000Z"),
    };

    expect(sleepOverlapsLocalDate(log, "2026-07-28", "UTC")).toBe(true);
    expect(sleepOverlapsLocalDate(log, "2026-07-29", "UTC")).toBe(true);
    expect(sleepOverlapsLocalDate(log, "2026-07-27", "UTC")).toBe(false);
  });
});
