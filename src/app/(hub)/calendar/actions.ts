"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { fromZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import {
  calendarConnections,
  calendarEvents,
  calendars,
} from "@/db/schema";
import {
  createRemoteCalendarEvent,
  deleteRemoteCalendarEvent,
  syncHouseholdCalendars,
  updateRemoteCalendarEvent,
} from "@/lib/calendar/sync";
import { requireHousehold } from "@/lib/household";

const eventInput = z.object({
  calendarId: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  location: z.string().trim().max(200).optional(),
});

export async function createCalendarEvent(formData: FormData) {
  const household = await requireHousehold();
  const input = eventInput.parse({
    calendarId: formData.get("calendarId"),
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location") || undefined,
  });
  const selected = await db
    .select({
      id: calendars.id,
      url: calendars.url,
      displayName: calendars.displayName,
      color: calendars.color,
      provider: calendarConnections.provider,
    })
    .from(calendars)
    .innerJoin(
      calendarConnections,
      eq(calendars.connectionId, calendarConnections.id),
    )
    .where(
      and(
        eq(calendars.id, input.calendarId),
        eq(calendarConnections.householdId, household.id),
      ),
    )
    .limit(1);
  if (!selected[0]) throw new Error("Calendar not found.");
  const startsAt = fromZonedTime(input.startsAt, household.timezone);
  const endsAt = fromZonedTime(input.endsAt, household.timezone);
  if (endsAt <= startsAt) throw new Error("Event end must be after its start.");

  const uid = `${randomUUID()}@homehub`;
  await createRemoteCalendarEvent({
    provider: selected[0].provider,
    householdId: household.id,
    calendarUrl: selected[0].url,
    calendarDisplayName: selected[0].displayName,
    calendarColor: selected[0].color,
    title: input.title,
    location: input.location,
    startsAt,
    endsAt,
    uid,
  });
  await syncHouseholdCalendars(household.id, true);
  revalidatePath("/", "layout");
}

export async function updateCalendarEvent(formData: FormData) {
  const household = await requireHousehold();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const input = eventInput.parse({
    calendarId: formData.get("calendarId"),
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location") || undefined,
  });
  const event = await db
    .select({
      id: calendarEvents.id,
      uid: calendarEvents.uid,
      href: calendarEvents.href,
      etag: calendarEvents.etag,
      rawIcal: calendarEvents.rawIcal,
      calendarUrl: calendars.url,
      provider: calendarConnections.provider,
    })
    .from(calendarEvents)
    .innerJoin(calendars, eq(calendarEvents.calendarId, calendars.id))
    .innerJoin(
      calendarConnections,
      eq(calendars.connectionId, calendarConnections.id),
    )
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarConnections.householdId, household.id),
      ),
    )
    .limit(1);
  if (!event[0]) throw new Error("Event not found.");
  await updateRemoteCalendarEvent({
    provider: event[0].provider,
    householdId: household.id,
    calendarUrl: event[0].calendarUrl,
    eventHref: event[0].href,
    eventEtag: event[0].etag,
    rawIcal: event[0].rawIcal,
    title: input.title,
    location: input.location,
    startsAt: fromZonedTime(input.startsAt, household.timezone),
    endsAt: fromZonedTime(input.endsAt, household.timezone),
    uid: event[0].uid,
  });
  await syncHouseholdCalendars(household.id, true);
  revalidatePath("/", "layout");
}

export async function deleteCalendarEvent(formData: FormData) {
  const household = await requireHousehold();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const event = await db
    .select({
      id: calendarEvents.id,
      href: calendarEvents.href,
      etag: calendarEvents.etag,
      rawIcal: calendarEvents.rawIcal,
      calendarUrl: calendars.url,
      provider: calendarConnections.provider,
    })
    .from(calendarEvents)
    .innerJoin(calendars, eq(calendarEvents.calendarId, calendars.id))
    .innerJoin(
      calendarConnections,
      eq(calendars.connectionId, calendarConnections.id),
    )
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarConnections.householdId, household.id),
      ),
    )
    .limit(1);
  if (!event[0]) throw new Error("Event not found.");
  await deleteRemoteCalendarEvent({
    provider: event[0].provider,
    householdId: household.id,
    calendarUrl: event[0].calendarUrl,
    eventHref: event[0].href,
    eventEtag: event[0].etag,
    rawIcal: event[0].rawIcal,
  });
  await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));
  revalidatePath("/", "layout");
}
