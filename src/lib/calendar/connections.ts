type CalendarConnection = {
  lastSyncedAt: Date | null;
};

export function calendarSyncStatus(connections: CalendarConnection[]) {
  if (!connections.length) {
    return { connected: false, lastSyncedAt: undefined as string | undefined };
  }
  const latest = connections.reduce((current, connection) => {
    if (!connection.lastSyncedAt) return current;
    if (!current) return connection.lastSyncedAt;
    return connection.lastSyncedAt > current
      ? connection.lastSyncedAt
      : current;
  }, null as Date | null);
  return {
    connected: true,
    lastSyncedAt: latest?.toISOString(),
  };
}
