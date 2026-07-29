import { describe, expect, it } from "vitest";
import { napDurationMinutes } from "./helpers";

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
