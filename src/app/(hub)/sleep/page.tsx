import { formatInTimeZone } from "date-fns-tz";
import { Moon } from "lucide-react";
import Link from "next/link";
import { NapChildRow, BedtimeChildRow, ManualNapForm, ManualNightSleepForm, SleepDayHistorySection } from "@/components/nap-controls";
import { NapPatternsSection } from "@/components/nap-patterns";
import { fetchNapPageData } from "@/lib/naps/store";
import { requireHousehold } from "@/lib/household";

export default async function SleepPage() {
  const household = await requireHousehold();
  const { localDate, weekDates, childProfiles, weekLogs } =
    await fetchNapPageData(household);
  const activeNapByProfile = new Map(
    weekLogs
      .filter((log) => log.kind === "nap" && !log.endedAt)
      .map((log) => [log.profileId, log]),
  );
  const activeNightByProfile = new Map(
    weekLogs
      .filter((log) => log.kind === "night" && !log.endedAt)
      .map((log) => [log.profileId, log]),
  );
  const dateLabel = formatInTimeZone(
    new Date(`${localDate}T12:00:00`),
    household.timezone,
    "EEEE, MMMM d",
  );
  const serializedWeekLogs = weekLogs.map((log) => ({
    id: log.id,
    profileId: log.profileId,
    kind: log.kind,
    localDate: log.localDate,
    startedAt: log.startedAt.toISOString(),
    endedAt: log.endedAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-[900px]">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sage)]">
          Rest and recharge
        </p>
        <h1 className="font-display mt-1 text-4xl font-semibold max-md:text-3xl">
          Sleep
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
                Track sleep
              </h2>
            </div>

            <div className="hub-card p-5 max-md:p-4">
              <div className="flex items-center gap-2">
                <Moon size={20} className="text-[var(--sage)]" />
                <h3 className="font-display text-2xl font-semibold">Nap timer</h3>
              </div>
              <div className="mt-4 space-y-3">
                {childProfiles.map((profile) => {
                  const activeNap = activeNapByProfile.get(profile.id);
                  return (
                    <NapChildRow
                      key={profile.id}
                      profile={profile}
                      activeNap={
                        activeNap
                          ? {
                              id: activeNap.id,
                              profileId: activeNap.profileId,
                              kind: activeNap.kind,
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
              <div className="flex items-center gap-2">
                <Moon size={20} className="text-[var(--sage)]" />
                <h3 className="font-display text-2xl font-semibold">Bedtime</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Start bedtime when they fall asleep, then log wake up in the morning.
              </p>
              <div className="mt-4 space-y-3">
                {childProfiles.map((profile) => {
                  const activeNight = activeNightByProfile.get(profile.id);
                  return (
                    <BedtimeChildRow
                      key={profile.id}
                      profile={profile}
                      activeNight={
                        activeNight
                          ? {
                              id: activeNight.id,
                              profileId: activeNight.profileId,
                              kind: activeNight.kind,
                              localDate: activeNight.localDate,
                              startedAt: activeNight.startedAt.toISOString(),
                              endedAt: activeNight.endedAt?.toISOString() ?? null,
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
              <h3 className="font-display text-2xl font-semibold">Log nap manually</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Add a nap after the fact or adjust exact start and end times.
              </p>
              <div className="mt-4">
                <ManualNapForm
                  childProfiles={childProfiles}
                  timezone={household.timezone}
                />
              </div>
            </div>

            <div className="hub-card p-5 max-md:p-4">
              <h3 className="font-display text-2xl font-semibold">Log night sleep</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Record when they fell asleep and optionally when they woke up.
                Overnight sleep appears on both evenings and mornings in the timeline.
              </p>
              <div className="mt-4">
                <ManualNightSleepForm
                  childProfiles={childProfiles}
                  timezone={household.timezone}
                />
              </div>
            </div>
          </section>

          <SleepDayHistorySection
            childProfiles={childProfiles}
            logs={serializedWeekLogs}
            localDate={localDate}
            timezone={household.timezone}
            title="Today's sleep"
          />

          <NapPatternsSection
            key={localDate}
            childProfiles={childProfiles}
            logs={serializedWeekLogs}
            weekDates={weekDates}
            todayLocalDate={localDate}
            timezone={household.timezone}
            weekStartsOn={household.weekStartsOn}
          />
        </div>
      ) : (
        <section className="hub-card mt-6 p-8 text-center">
          <p className="text-sm font-bold text-[var(--muted)]">
            Add a child profile in Settings to start logging sleep.
          </p>
          <Link href="/settings" className="hub-button mt-4 inline-flex">
            Open settings
          </Link>
        </section>
      )}
    </div>
  );
}
