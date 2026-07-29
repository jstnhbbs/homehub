import { randomUUID } from "node:crypto";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { napLogs, profiles } from "@/db/schema";
import { localDateIn } from "@/lib/dates";
import type { getCurrentHousehold } from "@/lib/household";

type Household = NonNullable<Awaited<ReturnType<typeof getCurrentHousehold>>>;

export type NapLogRecord = {
  id: string;
  profileId: string;
  localDate: string;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
};

function mapNap(row: typeof napLogs.$inferSelect): NapLogRecord {
  return {
    id: row.id,
    profileId: row.profileId,
    localDate: row.localDate,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    notes: row.notes,
  };
}

export async function fetchChildProfiles(householdId: string) {
  return db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.householdId, householdId),
        eq(profiles.profileType, "child"),
      ),
    )
    .orderBy(asc(profiles.sortOrder));
}

export async function fetchNapsForDate(household: Household, localDate: string) {
  const rows = await db
    .select()
    .from(napLogs)
    .where(
      and(
        eq(napLogs.householdId, household.id),
        or(eq(napLogs.localDate, localDate), isNull(napLogs.endedAt)),
      ),
    )
    .orderBy(asc(napLogs.startedAt));

  return rows.map(mapNap);
}

export async function fetchTodayNaps(household: Household) {
  const localDate = localDateIn(household.timezone);
  const [childProfiles, naps] = await Promise.all([
    fetchChildProfiles(household.id),
    fetchNapsForDate(household, localDate),
  ]);

  return { localDate, childProfiles, naps };
}

export async function startNap(household: Household, profileId: string) {
  const child = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        eq(profiles.id, profileId),
        eq(profiles.householdId, household.id),
        eq(profiles.profileType, "child"),
      ),
    )
    .limit(1);
  if (!child[0]) throw new Error("Child profile not found.");

  const active = await db
    .select({ id: napLogs.id })
    .from(napLogs)
    .where(
      and(
        eq(napLogs.householdId, household.id),
        eq(napLogs.profileId, profileId),
        isNull(napLogs.endedAt),
      ),
    )
    .limit(1);
  if (active[0]) throw new Error("This child already has an active nap.");

  const startedAt = new Date();
  const id = randomUUID();
  await db.insert(napLogs).values({
    id,
    householdId: household.id,
    profileId,
    localDate: localDateIn(household.timezone, startedAt),
    startedAt,
  });

  return id;
}

export async function endNap(household: Household, napId: string) {
  const updated = await db
    .update(napLogs)
    .set({ endedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(napLogs.id, napId),
        eq(napLogs.householdId, household.id),
        isNull(napLogs.endedAt),
      ),
    )
    .returning({ id: napLogs.id });
  if (!updated[0]) throw new Error("Active nap not found.");
}

export async function endNapForProfile(household: Household, profileId: string) {
  const active = await db
    .select({ id: napLogs.id })
    .from(napLogs)
    .where(
      and(
        eq(napLogs.householdId, household.id),
        eq(napLogs.profileId, profileId),
        isNull(napLogs.endedAt),
      ),
    )
    .limit(1);
  if (!active[0]) throw new Error("Active nap not found.");
  await endNap(household, active[0].id);
}

export async function deleteNap(household: Household, napId: string) {
  const deleted = await db
    .delete(napLogs)
    .where(and(eq(napLogs.id, napId), eq(napLogs.householdId, household.id)))
    .returning({ id: napLogs.id });
  if (!deleted[0]) throw new Error("Nap not found.");
}

export function serializeNap(nap: NapLogRecord) {
  return {
    id: nap.id,
    profileId: nap.profileId,
    localDate: nap.localDate,
    startedAt: nap.startedAt.toISOString(),
    endedAt: nap.endedAt?.toISOString() ?? null,
    notes: nap.notes,
  };
}
