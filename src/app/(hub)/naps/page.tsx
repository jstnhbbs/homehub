import { formatInTimeZone } from "date-fns-tz";
import { Moon } from "lucide-react";
import Link from "next/link";
import { NapChildRow, NapHistoryRow, ManualNapForm } from "@/components/nap-controls";
import { NapPreviousDaySection, NapWeeklySection } from "@/components/nap-stats";
import { formatNapDuration, totalNapMinutes } from "@/lib/naps/helpers";
import { fetchNapPageData } from "@/lib/naps/store";
import { requireHousehold } from "@/lib/household";

export default async function NapsPage() {
  const household = await requireHousehold();
  const {
    localDate,
    yesterdayLocalDate,
    weekDates,
    childProfiles,
    naps,
    yesterdayNaps,
    weekNaps,
  } = await fetchNapPageData(household);
  const profileMap = new Map(childProfiles.map((profile) => [profile.id, profile]));
  const activeByProfile = new Map(
    naps
      .filter((nap) => !nap.endedAt)
      .map((nap) => [nap.profileId, nap]),
  );
  const dateLabel = formatInTimeZone(
    new Date(`${localDate}T12:00:00`),
    household.timezone,
    "EEEE, MMMM d",
  );
  const totalMinutes = totalNapMinutes(naps.filter((nap) => nap.localDate === localDate));

  return (
    <div className="mx-auto max-w-[900px]">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sage)]">
          Rest and recharge
        </p>
        <h1 className="font-display mt-1 text-4xl font-semibold max-md:text-3xl">
          Nap log
        </h1>
        <p className="mt-2 text-sm font-bold text-[var(--muted)]">{dateLabel}</p>
      </div>

      {childProfiles.length ? (
        <div className="mt-6 space-y-6">
          <section className="hub-card p-5 max-md:p-4">
            <div className="flex items-center gap-2">
              <Moon size={20} className="text-[var(--sage)]" />
              <h2 className="font-display text-2xl font-semibold">Quick log</h2>
            </div>
            <div className="mt-4 space-y-3">
              {childProfiles.map((profile) => {
                const activeNap = activeByProfile.get(profile.id);
                return (
                  <NapChildRow
                    key={profile.id}
                    profile={profile}
                    activeNap={
                      activeNap
                        ? {
                            id: activeNap.id,
                            profileId: activeNap.profileId,
                            localDate: activeNap.localDate,
                            startedAt: activeNap.startedAt.toISOString(),
                            endedAt: activeNap.endedAt?.toISOString() ?? null,
                          }
                        : undefined
                    }
                    timezone={household.timezone}
                  />
                );
              })}
            </div>
          </section>

          <section className="hub-card p-5 max-md:p-4">
            <h2 className="font-display text-2xl font-semibold">Add nap manually</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Log a nap after the fact or adjust the exact start and end times.
            </p>
            <div className="mt-4">
              <ManualNapForm
                childProfiles={childProfiles}
                timezone={household.timezone}
              />
            </div>
          </section>

          <section className="hub-card p-5 max-md:p-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">
                Today&apos;s naps
              </h2>
              <p className="text-sm font-bold text-[var(--muted)]">
                {formatNapDuration(totalMinutes)} total
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {naps.length ? (
                naps.map((nap) => {
                  const profile = profileMap.get(nap.profileId);
                  if (!profile) return null;
                  return (
                    <NapHistoryRow
                      key={nap.id}
                      nap={{
                        id: nap.id,
                        profileId: nap.profileId,
                        localDate: nap.localDate,
                        startedAt: nap.startedAt.toISOString(),
                        endedAt: nap.endedAt?.toISOString() ?? null,
                      }}
                      profileName={profile.name}
                      profileColor={profile.color}
                      timezone={household.timezone}
                    />
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm font-bold text-[var(--muted)]">
                  No naps logged yet today.
                </p>
              )}
            </div>
          </section>

          <NapPreviousDaySection
            childProfiles={childProfiles}
            naps={yesterdayNaps}
            localDate={yesterdayLocalDate}
            timezone={household.timezone}
          />

          <NapWeeklySection
            childProfiles={childProfiles}
            naps={weekNaps}
            weekDates={weekDates}
            todayLocalDate={localDate}
            timezone={household.timezone}
            weekStartsOn={household.weekStartsOn}
          />
        </div>
      ) : (
        <section className="hub-card mt-6 p-8 text-center">
          <p className="text-sm font-bold text-[var(--muted)]">
            Add a child profile in Settings to start logging naps.
          </p>
          <Link href="/settings" className="hub-button mt-4 inline-flex">
            Open settings
          </Link>
        </section>
      )}
    </div>
  );
}
