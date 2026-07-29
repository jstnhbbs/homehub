"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NapHistoryRow } from "@/components/nap-controls";
import { formatLocalDate } from "@/lib/dates";
import { weekdayLabels, parseWeekStartsOn } from "@/lib/calendar/week-start";
import {
  childNapsForDate,
  childWeekNapStats,
  formatAverageNapCount,
  formatChildDaySummary,
  formatNapDuration,
  totalNapMinutes,
} from "@/lib/naps/helpers";
import {
  buildAwakeGaps,
  buildDayTimelineBars,
  HEATMAP_BLOCKS,
  napOverlapsHeatmapBlock,
  timelineHourLabels,
} from "@/lib/naps/timeline";

type ChildProfile = {
  id: string;
  name: string;
  color: string;
};

type SerializedNap = {
  id: string;
  profileId: string;
  localDate: string;
  startedAt: string;
  endedAt: string | null;
};

type NapPatternsProps = {
  childProfiles: ChildProfile[];
  naps: SerializedNap[];
  weekDates: string[];
  todayLocalDate: string;
  timezone: string;
  weekStartsOn: number;
};

function profileColorStyle(color: string) {
  return { backgroundColor: color };
}

function toNapRecords(naps: SerializedNap[]) {
  return naps.map((nap) => ({
    ...nap,
    startedAt: new Date(nap.startedAt),
    endedAt: nap.endedAt ? new Date(nap.endedAt) : null,
  }));
}

export function NapPatternsSection({
  childProfiles,
  naps,
  weekDates,
  todayLocalDate,
  timezone,
  weekStartsOn,
}: NapPatternsProps) {
  const [selectedDate, setSelectedDate] = useState(todayLocalDate);
  const [now, setNow] = useState(() => new Date());
  const napRecords = useMemo(() => toNapRecords(naps), [naps]);
  const dayLabels = weekdayLabels(parseWeekStartsOn(weekStartsOn));
  const hourLabels = timelineHourLabels();
  const selectedIndex = weekDates.indexOf(selectedDate);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedDateLabel = formatLocalDate(
    selectedDate,
    timezone,
    "EEEE, MMMM d",
  );
  const weekStartLabel = formatLocalDate(weekDates[0], timezone, "MMM d");
  const weekEndLabel = formatLocalDate(weekDates[6], timezone, "MMM d");
  const selectedDayNaps = napRecords.filter((nap) => nap.localDate === selectedDate);
  const isToday = selectedDate === todayLocalDate;

  function shiftSelectedDate(delta: number) {
    const nextIndex = selectedIndex + delta;
    if (nextIndex < 0 || nextIndex >= weekDates.length) return;
    setSelectedDate(weekDates[nextIndex]!);
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sage)]">
          Patterns
        </p>
        <h2 className="font-display mt-1 text-3xl font-semibold max-md:text-2xl">
          Sleep rhythms
        </h2>
        <p className="mt-2 text-sm font-bold text-[var(--muted)]">
          Tap a day in the grid to explore timing, wake windows, and weekly trends.
        </p>
      </div>

      <div className="hub-card p-5 max-md:p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-semibold">This week</h3>
            <p className="mt-1 text-sm font-bold text-[var(--muted)]">
              {weekStartLabel} – {weekEndLabel}
            </p>
          </div>
        </div>

        {childProfiles.length ? (
          <div className="mt-5 space-y-8">
            {childProfiles.map((profile) => {
              const stats = childWeekNapStats(
                napRecords,
                profile.id,
                weekDates,
                todayLocalDate,
                now,
              );

              return (
                <div key={profile.id} className="space-y-4">
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
                        const isSelected = day.localDate === selectedDate;
                        const isDayToday = day.localDate === todayLocalDate;
                        return (
                          <button
                            key={day.localDate}
                            type="button"
                            onClick={() => setSelectedDate(day.localDate)}
                            className={`rounded-2xl border p-3 text-left transition ${
                              isSelected
                                ? "border-[var(--sage)] bg-[var(--sage-soft)] ring-2 ring-[var(--sage)]/20"
                                : isDayToday
                                  ? "border-[var(--sage)] bg-[var(--tile-quiet)]"
                                  : "border-[var(--line)] hover:border-[var(--sage)]/50"
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
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[640px]">
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Week heatmap
                      </p>
                      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-1">
                        <div />
                        {weekDates.map((localDate) => (
                          <p
                            key={localDate}
                            className="text-center text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]"
                          >
                            {formatLocalDate(localDate, timezone, "EEE")}
                          </p>
                        ))}
                        {HEATMAP_BLOCKS.map((block) => (
                          <div key={block.label} className="contents">
                            <p className="py-2 text-[10px] font-bold text-[var(--muted)]">
                              {block.label}
                            </p>
                            {weekDates.map((localDate) => {
                              const profileDayNaps = childNapsForDate(
                                napRecords,
                                profile.id,
                                localDate,
                              );
                              const active = profileDayNaps.some((nap) =>
                                napOverlapsHeatmapBlock(
                                  nap,
                                  localDate,
                                  timezone,
                                  block,
                                  now,
                                ),
                              );
                              const isSelected = localDate === selectedDate;
                              return (
                                <button
                                  key={`${localDate}-${block.label}`}
                                  type="button"
                                  onClick={() => setSelectedDate(localDate)}
                                  className={`h-8 rounded-lg border transition ${
                                    isSelected ? "border-[var(--sage)]" : "border-transparent"
                                  } ${active ? "" : "bg-[var(--tile-quiet)]"}`}
                                  style={
                                    active
                                      ? {
                                          backgroundColor: profile.color,
                                          opacity: isSelected ? 0.72 : 0.42,
                                        }
                                      : undefined
                                  }
                                  aria-label={`${profile.name} ${block.label} on ${localDate}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
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
      </div>

      <div className="hub-card p-5 max-md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-semibold">Day timeline</h3>
            <p className="mt-1 text-sm font-bold text-[var(--muted)]">
              {selectedDateLabel}
              {isToday ? " · Today" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hub-button secondary !px-3 !py-2"
              onClick={() => shiftSelectedDate(-1)}
              disabled={selectedIndex <= 0}
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="hub-button secondary !px-3 !py-2"
              onClick={() => setSelectedDate(todayLocalDate)}
              disabled={isToday}
            >
              Today
            </button>
            <button
              type="button"
              className="hub-button secondary !px-3 !py-2"
              onClick={() => shiftSelectedDate(1)}
              disabled={selectedIndex >= weekDates.length - 1}
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {childProfiles.length ? (
          <div className="mt-5 space-y-6">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="mb-2 grid grid-cols-[120px_1fr] gap-3">
                  <div />
                  <div className="relative h-5">
                    {hourLabels.map((label, index) => (
                      <span
                        key={label}
                        className="absolute -translate-x-1/2 text-[10px] font-bold text-[var(--muted)]"
                        style={{
                          left: `${(index / (hourLabels.length - 1)) * 100}%`,
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {childProfiles.map((profile) => {
                  const profileDayNaps = childNapsForDate(
                    napRecords,
                    profile.id,
                    selectedDate,
                  );
                  const bars = buildDayTimelineBars(
                    profileDayNaps.map((nap) => ({ ...nap, id: nap.id })),
                    selectedDate,
                    timezone,
                    now,
                  );
                  const gaps = buildAwakeGaps(
                    profileDayNaps,
                    selectedDate,
                    timezone,
                  );

                  return (
                    <div key={profile.id} className="mb-4 grid grid-cols-[120px_1fr] gap-3">
                      <div className="flex items-center gap-2 pt-3">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={profileColorStyle(profile.color)}
                        />
                        <div>
                          <p className="text-sm font-bold">{profile.name}</p>
                          <p className="text-xs font-bold text-[var(--muted)]">
                            {formatChildDaySummary(
                              profileDayNaps.length,
                              totalNapMinutes(profileDayNaps, now),
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="relative h-16 rounded-2xl border border-[var(--line)] bg-[var(--tile-quiet)]">
                        <div className="absolute inset-0">
                          {hourLabels.map((label, index) => (
                            <div
                              key={`${profile.id}-${label}`}
                              className="absolute inset-y-0 border-l border-[var(--line)]/70"
                              style={{
                                left: `${(index / (hourLabels.length - 1)) * 100}%`,
                              }}
                            />
                          ))}
                        </div>

                        {gaps.map((gap) => (
                          <div
                            key={`${profile.id}-gap-${gap.leftPercent}`}
                            className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center px-1"
                            style={{
                              left: `${gap.leftPercent}%`,
                              width: `${gap.widthPercent}%`,
                            }}
                          >
                            <span className="truncate text-[10px] font-bold text-[var(--muted)]">
                              {gap.widthPercent > 8 ? gap.label : ""}
                            </span>
                          </div>
                        ))}

                        {bars.map((bar) => (
                          <div
                            key={bar.napId}
                            className="absolute top-2 bottom-2 rounded-xl px-2 py-1 text-[10px] font-bold text-white shadow-sm"
                            style={{
                              left: `${bar.leftPercent}%`,
                              width: `${bar.widthPercent}%`,
                              backgroundColor: profile.color,
                              minWidth: "2rem",
                            }}
                            title={`${bar.timeLabel} · ${bar.durationLabel}`}
                          >
                            <span className="block truncate">
                              {bar.widthPercent > 10 ? bar.durationLabel : ""}
                            </span>
                          </div>
                        ))}

                        {!bars.length ? (
                          <p className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--muted)]">
                            No naps logged
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[var(--line)] pt-5">
              <div className="flex items-end justify-between gap-3">
                <h4 className="font-display text-xl font-semibold">
                  {isToday ? "Today's naps" : "Naps this day"}
                </h4>
                <p className="text-sm font-bold text-[var(--muted)]">
                  {formatNapDuration(totalNapMinutes(selectedDayNaps, now))} total
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {selectedDayNaps.length ? (
                  selectedDayNaps.map((nap) => {
                    const profile = childProfiles.find(
                      (item) => item.id === nap.profileId,
                    );
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
                        timezone={timezone}
                      />
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm font-bold text-[var(--muted)]">
                    No naps logged on this day.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
