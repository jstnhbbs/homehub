"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseLocalDateTimeInput } from "@/lib/naps/datetime";
import {
  createManualNap,
  deleteNap,
  endNap,
  endNapForProfile,
  startNap,
  updateNapTimes,
} from "@/lib/naps/store";
import { requireHousehold } from "@/lib/household";

const profileIdSchema = z.string().uuid();
const napIdSchema = z.string().uuid();

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function startNapAction(profileId: string) {
  const household = await requireHousehold();
  await startNap(household, profileIdSchema.parse(profileId));
  revalidatePath("/", "layout");
}

export async function endNapAction(napId: string) {
  const household = await requireHousehold();
  await endNap(household, napIdSchema.parse(napId));
  revalidatePath("/", "layout");
}

export async function endNapForProfileAction(profileId: string) {
  const household = await requireHousehold();
  await endNapForProfile(household, profileIdSchema.parse(profileId));
  revalidatePath("/", "layout");
}

export async function deleteNapAction(napId: string) {
  const household = await requireHousehold();
  await deleteNap(household, napIdSchema.parse(napId));
  revalidatePath("/", "layout");
}

export async function createManualNapAction(formData: FormData) {
  const household = await requireHousehold();
  const profileId = profileIdSchema.parse(text(formData, "profileId"));
  const startedAtRaw = text(formData, "startedAt");
  const endedAtRaw = text(formData, "endedAt");

  if (!startedAtRaw) throw new Error("Start time is required.");

  await createManualNap(
    household,
    profileId,
    parseLocalDateTimeInput(startedAtRaw, household.timezone),
    endedAtRaw
      ? parseLocalDateTimeInput(endedAtRaw, household.timezone)
      : null,
  );
  revalidatePath("/", "layout");
}

export async function updateNapAction(napId: string, formData: FormData) {
  const household = await requireHousehold();
  const startedAtRaw = text(formData, "startedAt");
  const endedAtRaw = text(formData, "endedAt");

  if (!startedAtRaw) throw new Error("Start time is required.");

  await updateNapTimes(
    household,
    napIdSchema.parse(napId),
    parseLocalDateTimeInput(startedAtRaw, household.timezone),
    endedAtRaw
      ? parseLocalDateTimeInput(endedAtRaw, household.timezone)
      : null,
  );
  revalidatePath("/", "layout");
}
