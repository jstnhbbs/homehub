"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  deleteNap,
  endNap,
  endNapForProfile,
  startNap,
} from "@/lib/naps/store";
import { requireHousehold } from "@/lib/household";

const profileIdSchema = z.string().uuid();
const napIdSchema = z.string().uuid();

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
