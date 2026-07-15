import {
  syncICloudCalendars,
  createICloudEvent,
  updateICloudEvent,
  deleteICloudEvent,
} from "@/lib/caldav/client";
import {
  syncGoogleCalendars,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
} from "@/lib/google/calendar";

export type SyncResult =
  | { status: "not-connected" }
  | { status: "fresh" }
  | { status: "already-syncing" }
  | { status: "synced"; count: number }
  | { status: "error" };

export async function syncHouseholdCalendars(
  householdId: string,
  force = false,
): Promise<{ results: SyncResult[] }> {
  const [icloud, google] = await Promise.all([
    syncICloudCalendars(householdId, force),
    syncGoogleCalendars(householdId, force),
  ]);
  return { results: [icloud, google] };
}

export async function createRemoteCalendarEvent(input: {
  provider: "icloud" | "google";
  householdId: string;
  calendarUrl: string;
  calendarDisplayName: string;
  calendarColor: string;
  title: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  uid: string;
}) {
  if (input.provider === "google") {
    await createGoogleEvent({
      householdId: input.householdId,
      calendarUrl: input.calendarUrl,
      title: input.title,
      location: input.location,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      uid: input.uid,
    });
    return;
  }
  await createICloudEvent({
    householdId: input.householdId,
    calendarUrl: input.calendarUrl,
    calendarDisplayName: input.calendarDisplayName,
    calendarColor: input.calendarColor,
    title: input.title,
    location: input.location,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    uid: input.uid,
  });
}

export async function updateRemoteCalendarEvent(input: {
  provider: "icloud" | "google";
  householdId: string;
  calendarUrl: string;
  eventHref: string;
  eventEtag: string | null;
  rawIcal: string;
  title: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  uid: string;
}) {
  if (input.provider === "google") {
    await updateGoogleEvent({
      householdId: input.householdId,
      calendarUrl: input.calendarUrl,
      eventId: input.eventHref,
      title: input.title,
      location: input.location,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      uid: input.uid,
    });
    return;
  }
  await updateICloudEvent({
    householdId: input.householdId,
    eventHref: input.eventHref,
    eventEtag: input.eventEtag,
    rawIcal: input.rawIcal,
    title: input.title,
    location: input.location,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    uid: input.uid,
  });
}

export async function deleteRemoteCalendarEvent(input: {
  provider: "icloud" | "google";
  householdId: string;
  calendarUrl: string;
  eventHref: string;
  eventEtag: string | null;
  rawIcal: string;
}) {
  if (input.provider === "google") {
    await deleteGoogleEvent({
      householdId: input.householdId,
      calendarUrl: input.calendarUrl,
      eventId: input.eventHref,
    });
    return;
  }
  await deleteICloudEvent({
    householdId: input.householdId,
    eventHref: input.eventHref,
    eventEtag: input.eventEtag,
    rawIcal: input.rawIcal,
  });
}
