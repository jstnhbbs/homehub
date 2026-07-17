"use client";

import { useState } from "react";
import {
  CHORE_WEEKDAY_OPTIONS,
  weeklyChoreDay,
} from "@/lib/chores";

export function ChoreCadenceFields({
  defaultCadence = "daily",
  defaultDays = "0,1,2,3,4,5,6",
  cadenceLabel = "Chore frequency",
  dayLabel = "Day of the week",
}: {
  defaultCadence?: "daily" | "weekly";
  defaultDays?: string;
  cadenceLabel?: string;
  dayLabel?: string;
}) {
  const [cadence, setCadence] = useState<"daily" | "weekly">(defaultCadence);
  const defaultWeekDay = weeklyChoreDay(defaultDays);

  return (
    <>
      <select
        name="cadence"
        className="hub-input"
        value={cadence}
        onChange={(event) =>
          setCadence(event.target.value as "daily" | "weekly")
        }
        aria-label={cadenceLabel}
      >
        <option value="daily">Every day</option>
        <option value="weekly">Once a week</option>
      </select>
      {cadence === "weekly" && (
        <select
          name="weekDay"
          className="hub-input"
          defaultValue={defaultWeekDay}
          aria-label={dayLabel}
        >
          {CHORE_WEEKDAY_OPTIONS.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
