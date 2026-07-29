import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, isNull, lte, ne, or } from "drizzle-orm";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { db } from "@/db/client";
import { napLogs, profiles } from "@/db/schema";
import { parseWeekStartsOn } from "@/lib/calendar/week-start";
import { localDateIn, weekDates } from "@/lib/dates";
import { addLocalDays } from "@/lib/naps/datetime";
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

function validateNapTimes(startedAt: Date, endedAt: Date | null) {
  if (endedAt && endedAt.getTime() <= startedAt.getTime()) {
    throw new Error("End time must be after start time.");
  }
}

async function assertChildProfile(household: Household, profileId: string) {
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
}

async function assertNoActiveNap(
  household: Household,
  profileId: string,
  excludeNapId?: string,
) {
  const conditions = [
    eq(napLogs.householdId, household.id),
    eq(napLogs.profileId, profileId),
    isNull(napLogs.endedAt),
  ];
  if (excludeNapId) {
    conditions.push(ne(napLogs.id, excludeNapId));
  }

  const active = await db
    .select({ id: napLogs.id })
    .from(napLogs)
    .where(and(...conditions))
    .limit(1);
  if (active[0]) throw new Error("This child already has an active nap.");
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

export async function fetchNapsForLocalDate(household: Household, localDate: string) {
  const rows = await db
    .select()
    .from(napLogs)
    .where(
      and(
        eq(napLogs.householdId, household.id),
        eq(napLogs.localDate, localDate),
      ),
    )
    .orderBy(asc(napLogs.startedAt));

  return rows.map(mapNap);
}

export async function fetchNapsInRange(
  household: Household,
  startLocalDate: string,
  endLocalDate: string,
) {
  const rows = await db
    .select()
    .from(napLogs)
    .where(
      and(
        eq(napLogs.householdId, household.id),
        gte(napLogs.localDate, startLocalDate),
        lte(napLogs.localDate, endLocalDate),
      ),
    )
    .orderBy(asc(napLogs.startedAt));

  return rows.map(mapNap);
}

export async function fetchNapPageData(household: Household) {
  const localDate = localDateIn(household.timezone);
  const yesterdayLocalDate = addLocalDays(localDate, household.timezone, -1);
  const weekStartsOn = parseWeekStartsOn(household.weekStartsOn);
  const weekDays = weekDates(
    fromZonedTime(`${localDate}T12:00:00`, household.timezone),
    weekStartsOn,
  );
  const weekDatesList = weekDays.map((day) => format(day, "yyyy-MM-dd"));
  const weekStart = weekDatesList[0];
  const weekEnd = weekDatesList[6];

  const [childProfiles, naps, yesterdayNaps, weekNaps] = await Promise.all([
    fetchChildProfiles(household.id),
    fetchNapsForDate(household, localDate),
    fetchNapsForLocalDate(household, yesterdayLocalDate),
    fetchNapsInRange(household, weekStart, weekEnd),
  ]);

  return {
    localDate,
    yesterdayLocalDate,
    weekDates: weekDatesList,
    childProfiles,
    naps,
    yesterdayNaps,
    weekNaps,
  };
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
  await assertChildProfile(household, profileId);
  await assertNoActiveNap(household, profileId);

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

export async function createManualNap(
  household: Household,
  profileId: string,
  startedAt: Date,
  endedAt: Date | null,
) {
  await assertChildProfile(household, profileId);
  validateNapTimes(startedAt, endedAt);
  if (!endedAt) {
    await assertNoActiveNap(household, profileId);
  }

  const id = randomUUID();
  await db.insert(napLogs).values({
    id,
    householdId: household.id,
    profileId,
    localDate: localDateIn(household.timezone, startedAt),
    startedAt,
    endedAt,
  });

  return id;
}

export async function updateNapTimes(
  household: Household,
  napId: string,
  startedAt: Date,
  endedAt: Date | null,
) {
  validateNapTimes(startedAt, endedAt);

  const existing = await db
    .select()
    .from(napLogs)
    .where(and(eq(napLogs.id, napId), eq(napLogs.householdId, household.id)))
    .limit(1);
  if (!existing[0]) throw new Error("Nap not found.");

  if (!endedAt) {
    await assertNoActiveNap(household, existing[0].profileId, napId);
  }

  const updated = await db
    .update(napLogs)
    .set({
      startedAt,
      endedAt,
      localDate: localDateIn(household.timezone, startedAt),
      updatedAt: new Date(),
    })
    .where(and(eq(napLogs.id, napId), eq(napLogs.householdId, household.id)))
    .returning({ id: napLogs.id });
  if (!updated[0]) throw new Error("Nap not found.");
}

export async function endNap(
  household: Household,
  napId: string,
  endedAt: Date = new Date(),
) {
  const existing = await db
    .select({ startedAt: napLogs.startedAt })
    .from(napLogs)
    .where(
      and(
        eq(napLogs.id, napId),
        eq(napLogs.householdId, household.id),
        isNull(napLogs.endedAt),
      ),
    )
    .limit(1);
  if (!existing[0]) throw new Error("Active nap not found.");
  validateNapTimes(existing[0].startedAt, endedAt);

  const updated = await db
    .update(napLogs)
    .set({ endedAt, updatedAt: new Date() })
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
