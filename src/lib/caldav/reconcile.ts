export function staleCalendarEventIds(
  cachedEvents: Array<{
    id: string;
    href: string;
    updatedAt: Date;
  }>,
  remoteHrefs: Set<string>,
  syncStartedAt: Date,
) {
  return cachedEvents
    .filter(
      (event) =>
        !remoteHrefs.has(event.href) &&
        event.updatedAt.getTime() <= syncStartedAt.getTime(),
    )
    .map((event) => event.id);
}
