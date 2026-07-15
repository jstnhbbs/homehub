import { describe, expect, it } from "vitest";
import { googleEventToParsed } from "./events";

describe("googleEventToParsed", () => {
  it("parses timed events", () => {
    const parsed = googleEventToParsed(
      {
        id: "abc123",
        summary: "Soccer practice",
        start: { dateTime: "2026-07-15T18:00:00-05:00" },
        end: { dateTime: "2026-07-15T19:00:00-05:00" },
      },
      "America/Chicago",
    );
    expect(parsed.title).toBe("Soccer practice");
    expect(parsed.allDay).toBe(false);
  });

  it("parses all-day events in the household timezone", () => {
    const parsed = googleEventToParsed(
      {
        id: "all-day",
        summary: "Field trip",
        start: { date: "2026-07-20" },
        end: { date: "2026-07-21" },
      },
      "America/Chicago",
    );
    expect(parsed.title).toBe("Field trip");
    expect(parsed.allDay).toBe(true);
  });
});
