"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useState } from "react";
import {
  deleteNapAction,
  endNapAction,
  endNapForProfileAction,
  startNapAction,
} from "@/app/(hub)/naps/actions";
import { formatNapDuration, napDurationMinutes } from "@/lib/naps/helpers";

type ChildProfile = {
  id: string;
  name: string;
  color: string;
};

type NapItem = {
  id: string;
  profileId: string;
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

export function NapChildRow({
  profile,
  activeNap,
  timezone,
  compact = false,
}: {
  profile: ChildProfile;
  activeNap?: NapItem;
  timezone: string;
  compact?: boolean;
}) {
  const startedLabel = activeNap
    ? formatInTimeZone(new Date(activeNap.startedAt), timezone, "h:mm a")
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
            ) : (
              <p className="text-xs font-bold text-[var(--muted)]">
                No active nap
              </p>
            )}
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
  const startedLabel = formatInTimeZone(new Date(nap.startedAt), timezone, "h:mm a");
  const endedLabel = nap.endedAt
    ? formatInTimeZone(new Date(nap.endedAt), timezone, "h:mm a")
    : "In progress";

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--tile-quiet)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={profileColorStyle(profileColor)}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{profileName}</p>
          <p className="text-xs font-bold text-[var(--muted)]">
            {startedLabel} – {endedLabel} ·{" "}
            <LiveDuration
              startedAt={nap.startedAt}
              endedAt={nap.endedAt}
            />
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {nap.endedAt ? null : (
          <form action={endNapForProfileAction.bind(null, nap.profileId)}>
            <button type="submit" className="hub-button secondary !min-h-8 !px-2 text-xs">
              End
            </button>
          </form>
        )}
        <form action={deleteNapAction.bind(null, nap.id)}>
          <button
            type="submit"
            className="text-xs font-bold text-[var(--coral)]"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
