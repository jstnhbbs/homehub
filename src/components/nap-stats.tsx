import { formatLocalDate } from "@/lib/dates";
import { weekdayLabels, parseWeekStartsOn } from "@/lib/calendar/week-start";
import {
  childWeekNapStats,
  formatAverageNapCount,
  formatChildDaySummary,
  formatNapDuration,
  totalNapMinutes,
} from "@/lib/naps/helpers";
import type { NapLogRecord } from "@/lib/naps/store";
import { NapHistoryRow } from "@/components/nap-controls";

type ChildProfile = {
  id: string;
  name: string;
  color: string;
};

function profileColorStyle(color: string) {
  return { backgroundColor: color };
}

export function NapPreviousDaySection({
  childProfiles,
  naps,
  localDate,
  timezone,
}: {
  childProfiles: ChildProfile[];
  naps: NapLogRecord[];
  localDate: string;
  timezone: string;
}) {
  const dateLabel = formatLocalDate(localDate, timezone, "EEEE, MMMM d");
  const totalMinutes = totalNapMinutes(naps);

  return (
    <section className="hub-card p-5 max-md:p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Yesterday</h2>
          <p className="mt-1 text-sm font-bold text-[var(--muted)]">{dateLabel}</p>
        </div>
        <p className="text-sm font-bold text-[var(--muted)]">
          {formatNapDuration(totalMinutes)} total
        </p>
      </div>

      {!naps.length ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm font-bold text-[var(--muted)]">
          No naps logged yesterday.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {childProfiles.map((profile) => {
            const profileNaps = naps.filter((nap) => nap.profileId === profile.id);
            if (!profileNaps.length) return null;
            return (
              <div key={profile.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={profileColorStyle(profile.color)}
                  />
                  <p className="text-sm font-bold">{profile.name}</p>
                  <p className="text-sm font-bold text-[var(--muted)]">
                    {formatChildDaySummary(
                      profileNaps.length,
                      totalNapMinutes(profileNaps),
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  {profileNaps.map((nap) => (
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
                      timezone={timezone}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function NapWeeklySection({
  childProfiles,
  naps,
  weekDates,
  todayLocalDate,
  timezone,
  weekStartsOn,
}: {
  childProfiles: ChildProfile[];
  naps: NapLogRecord[];
  weekDates: string[];
  todayLocalDate: string;
  timezone: string;
  weekStartsOn: number;
}) {
  const weekStartLabel = formatLocalDate(weekDates[0], timezone, "MMM d");
  const weekEndLabel = formatLocalDate(weekDates[6], timezone, "MMM d");
  const dayLabels = weekdayLabels(parseWeekStartsOn(weekStartsOn));

  return (
    <section className="hub-card overflow-hidden p-5 max-md:p-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">This week</h2>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">
          {weekStartLabel} – {weekEndLabel}
        </p>
      </div>

      {childProfiles.length ? (
        <div className="mt-5 space-y-6">
          {childProfiles.map((profile) => {
            const stats = childWeekNapStats(
              naps,
              profile.id,
              weekDates,
              todayLocalDate,
            );

            return (
              <div key={profile.id} className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={profileColorStyle(profile.color)}
                    />
                    <p className="text-sm font-bold">{profile.name}</p>
                  </div>
                  <p className="text-sm font-bold text-[var(--muted)]">
                    Avg {formatAverageNapCount(stats.avgNapsPerDay)} naps/day ·{" "}
                    {formatNapDuration(Math.round(stats.avgMinutesPerDay))}/day
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[640px] grid grid-cols-7 gap-2">
                    {stats.days.map((day, index) => {
                      const isToday = day.localDate === todayLocalDate;
                      return (
                        <div
                          key={day.localDate}
                          className={`rounded-2xl border p-3 ${
                            isToday
                              ? "border-[var(--sage)] bg-[var(--tile-quiet)]"
                              : "border-[var(--line)]"
                          }`}
                        >
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                            {dayLabels[index]}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                            {formatLocalDate(day.localDate, timezone, "MMM d")}
                          </p>
                          <p className="mt-3 text-lg font-semibold">
                            {day.napCount}
                          </p>
                          <p className="text-xs font-bold text-[var(--muted)]">
                            {day.napCount
                              ? formatNapDuration(day.totalMinutes)
                              : "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-sm font-bold text-[var(--muted)]">
                  Week total: {stats.totalNaps} naps ·{" "}
                  {formatNapDuration(stats.totalMinutes)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm font-bold text-[var(--muted)]">
          Add a child profile to see weekly nap trends.
        </p>
      )}
    </section>
  );
}
