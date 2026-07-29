import { formatInTimeZone } from "date-fns-tz";
import { Moon } from "lucide-react";
import Link from "next/link";
import { NapChildRow, ManualNapForm } from "@/components/nap-controls";
import { NapPatternsSection } from "@/components/nap-patterns";
import { fetchNapPageData } from "@/lib/naps/store";
import { requireHousehold } from "@/lib/household";

export default async function NapsPage() {
  const household = await requireHousehold();
  const {
    localDate,
    weekDates,
    childProfiles,
    naps,
    weekNaps,
  } = await fetchNapPageData(household);
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
  const serializedWeekNaps = weekNaps.map((nap) => ({
    id: nap.id,
    profileId: nap.profileId,
    localDate: nap.localDate,
    startedAt: nap.startedAt.toISOString(),
    endedAt: nap.endedAt?.toISOString() ?? null,
  }));

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
        <div className="mt-6 space-y-8">
          <section className="space-y-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sage)]">
                Log
              </p>
              <h2 className="font-display mt-1 text-3xl font-semibold max-md:text-2xl">
                Track naps
              </h2>
            </div>

            <div className="hub-card p-5 max-md:p-4">
              <div className="flex items-center gap-2">
                <Moon size={20} className="text-[var(--sage)]" />
                <h3 className="font-display text-2xl font-semibold">Quick log</h3>
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
            </div>

            <div className="hub-card p-5 max-md:p-4">
              <h3 className="font-display text-2xl font-semibold">Add nap manually</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Log a nap after the fact or adjust the exact start and end times.
              </p>
              <div className="mt-4">
                <ManualNapForm
                  childProfiles={childProfiles}
                  timezone={household.timezone}
                />
              </div>
            </div>
          </section>

          <NapPatternsSection
            key={localDate}
            childProfiles={childProfiles}
            naps={serializedWeekNaps}
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
