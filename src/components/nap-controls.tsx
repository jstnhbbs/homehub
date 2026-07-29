"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useState } from "react";
import {
  createManualNapAction,
  deleteNapAction,
  endNapAction,
  endNapForProfileAction,
  startNapAction,
  updateNapAction,
} from "@/app/(hub)/naps/actions";
import {
  defaultManualStartInput,
  toLocalDateTimeInput,
} from "@/lib/naps/datetime";
import { formatNapDuration, formatChildTodayNapSummary, napDurationMinutes } from "@/lib/naps/helpers";

type ChildProfile = {
  id: string;
  name: string;
  color: string;
};

type NapItem = {
  id: string;
  profileId: string;
  localDate: string;
  startedAt: string;
  endedAt: string | null;
};

function profileColorStyle(color: string) {
  return { backgroundColor: color };
}

function LiveDuration({
  startedAt,
  endedAt,
}: {
  startedAt: string;
  endedAt: string | null;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (endedAt) return;
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [endedAt]);

  const minutes = napDurationMinutes(
    new Date(startedAt),
    endedAt ? new Date(endedAt) : null,
    now,
  );

  return <span>{formatNapDuration(minutes)}</span>;
}

export function ManualNapForm({
  childProfiles,
  timezone,
}: {
  childProfiles: ChildProfile[];
  timezone: string;
}) {
  const defaultProfileId = childProfiles[0]?.id ?? "";
  const [profileId, setProfileId] = useState(defaultProfileId);
  const [startedAt, setStartedAt] = useState(() =>
    defaultManualStartInput(timezone),
  );
  const [endedAt, setEndedAt] = useState("");

  return (
    <form action={createManualNapAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
            Child
          </span>
          <select
            name="profileId"
            className="hub-input"
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            required
          >
            {childProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
        <div />
        <label className="block space-y-1.5">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
            Start time
          </span>
          <input
            type="datetime-local"
            name="startedAt"
            className="hub-input"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
            End time
          </span>
          <input
            type="datetime-local"
            name="endedAt"
            className="hub-input"
            value={endedAt}
            onChange={(event) => setEndedAt(event.target.value)}
          />
          <span className="text-xs font-bold text-[var(--muted)]">
            Leave blank if the nap is still in progress.
          </span>
        </label>
      </div>
      <button type="submit" className="hub-button">
        Add nap
      </button>
    </form>
  );
}

export function NapChildRow({
  profile,
  activeNap,
  timezone,
  compact = false,
  todayNaps,
  localDate,
}: {
  profile: ChildProfile;
  activeNap?: NapItem;
  timezone: string;
  compact?: boolean;
  todayNaps?: NapItem[];
  localDate?: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!compact || !localDate) return;
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [compact, localDate]);

  const startedLabel = activeNap
    ? formatInTimeZone(new Date(activeNap.startedAt), timezone, "h:mm a")
    : null;
  const summaryLine =
    compact && localDate && todayNaps
      ? formatChildTodayNapSummary(
          todayNaps.map((nap) => ({
            localDate: nap.localDate,
            startedAt: new Date(nap.startedAt),
            endedAt: nap.endedAt ? new Date(nap.endedAt) : null,
          })),
          localDate,
          now,
          { isActive: !!activeNap },
        )
      : null;

  return (
    <div
      className={
        compact
          ? "rounded-2xl bg-[var(--tile-quiet)] p-3"
          : "rounded-2xl bg-[var(--tile)] p-4"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={profileColorStyle(profile.color)}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{profile.name}</p>
            {activeNap ? (
              <p className="text-xs font-bold text-[var(--muted)]">
                Asleep since {startedLabel} ·{" "}
                <LiveDuration
                  startedAt={activeNap.startedAt}
                  endedAt={activeNap.endedAt}
                />
              </p>
            ) : !compact ? (
              <p className="text-xs font-bold text-[var(--muted)]">
                No active nap
              </p>
            ) : null}
            {summaryLine ? (
              <p className="text-xs font-bold text-[var(--muted)]">
                {summaryLine}
              </p>
            ) : null}
          </div>
        </div>

        {activeNap ? (
          <form action={endNapAction.bind(null, activeNap.id)}>
            <button type="submit" className="hub-button secondary !min-h-9 !px-3 text-xs">
              End nap
            </button>
          </form>
        ) : (
          <form action={startNapAction.bind(null, profile.id)}>
            <button type="submit" className="hub-button secondary !min-h-9 !px-3 text-xs">
              Start nap
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function NapHistoryRow({
  nap,
  profileName,
  profileColor,
  timezone,
}: {
  nap: NapItem;
  profileName: string;
  profileColor: string;
  timezone: string;
}) {
  const [editing, setEditing] = useState(false);
  const [startedAt, setStartedAt] = useState(() =>
    toLocalDateTimeInput(new Date(nap.startedAt), timezone),
  );
  const [endedAt, setEndedAt] = useState(() =>
    nap.endedAt ? toLocalDateTimeInput(new Date(nap.endedAt), timezone) : "",
  );

  useEffect(() => {
    setStartedAt(toLocalDateTimeInput(new Date(nap.startedAt), timezone));
    setEndedAt(
      nap.endedAt ? toLocalDateTimeInput(new Date(nap.endedAt), timezone) : "",
    );
  }, [nap.startedAt, nap.endedAt, timezone]);

  const startedLabel = formatInTimeZone(
    new Date(nap.startedAt),
    timezone,
    "h:mm a",
  );
  const endedLabel = nap.endedAt
    ? formatInTimeZone(new Date(nap.endedAt), timezone, "h:mm a")
    : "In progress";

  return (
    <div className="rounded-2xl bg-[var(--tile-quiet)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={profileColorStyle(profileColor)}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{profileName}</p>
            {!editing && (
              <p className="text-xs font-bold text-[var(--muted)]">
                {startedLabel} – {endedLabel} ·{" "}
                <LiveDuration
                  startedAt={nap.startedAt}
                  endedAt={nap.endedAt}
                />
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!editing && nap.endedAt == null && (
            <form action={endNapForProfileAction.bind(null, nap.profileId)}>
              <button type="submit" className="hub-button secondary !min-h-8 !px-2 text-xs">
                End
              </button>
            </form>
          )}
          {!editing && (
            <button
              type="button"
              className="text-xs font-bold text-[var(--sage)]"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
          {!editing && (
            <form action={deleteNapAction.bind(null, nap.id)}>
              <button
                type="submit"
                className="text-xs font-bold text-[var(--coral)]"
              >
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      {editing && (
        <form
          action={updateNapAction.bind(null, nap.id)}
          className="mt-4 space-y-3 border-t border-[var(--line)] pt-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                Start time
              </span>
              <input
                type="datetime-local"
                name="startedAt"
                className="hub-input"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                End time
              </span>
              <input
                type="datetime-local"
                name="endedAt"
                className="hub-input"
                value={endedAt}
                onChange={(event) => setEndedAt(event.target.value)}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="hub-button secondary !min-h-9 !px-4 text-xs">
              Save
            </button>
            <button
              type="button"
              className="hub-button secondary !min-h-9 !px-4 text-xs"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
