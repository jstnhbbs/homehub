import { describe, expect, it } from "vitest";
import { staleCalendarEventIds } from "./reconcile";

describe("calendar cache reconciliation", () => {
  const syncStartedAt = new Date("2026-07-15T15:00:00.000Z");
  const cachedEvents = [
    {
      id: "still-remote",
      href: "/calendar/still-remote.ics",
      updatedAt: new Date("2026-07-14T15:00:00.000Z"),
    },
    {
      id: "deleted-remotely",
      href: "/calendar/deleted.ics",
      updatedAt: new Date("2026-07-14T15:00:00.000Z"),
    },
    {
      id: "created-during-sync",
      href: "/calendar/new.ics",
      updatedAt: new Date("2026-07-15T15:00:01.000Z"),
    },
  ];

  it("removes cached events missing from the complete remote result", () => {
    expect(
      staleCalendarEventIds(
        cachedEvents,
        new Set(["/calendar/still-remote.ics"]),
        syncStartedAt,
      ),
    ).toEqual(["deleted-remotely"]);
  });

  it("clears old cache entries when the remote calendar is empty", () => {
    expect(
      staleCalendarEventIds(cachedEvents, new Set(), syncStartedAt),
    ).toEqual(["still-remote", "deleted-remotely"]);
  });
});
