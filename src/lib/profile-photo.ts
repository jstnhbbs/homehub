import { del, head } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";

export const PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

function isManagedProfilePhoto(url: string, profileId: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".public.blob.vercel-storage.com") &&
      parsed.pathname.startsWith(`/profiles/${profileId}/`)
    );
  } catch {
    return false;
  }
}

export async function saveProfilePhotoForHousehold(input: {
  householdId: string;
  profileId: string;
  url: string;
}) {
  if (!isManagedProfilePhoto(input.url, input.profileId)) {
    throw new Error("That profile photo URL is not valid.");
  }

  const blob = await head(input.url);
  if (
    !blob.contentType ||
    !PROFILE_PHOTO_TYPES.includes(
      blob.contentType as (typeof PROFILE_PHOTO_TYPES)[number],
    ) ||
    blob.size > PROFILE_PHOTO_MAX_BYTES
  ) {
    throw new Error("The uploaded file is not a supported profile photo.");
  }

  const existing = await db
    .select({ avatar: profiles.avatar })
    .from(profiles)
    .where(
      and(
        eq(profiles.id, input.profileId),
        eq(profiles.householdId, input.householdId),
      ),
    )
    .limit(1);
  if (!existing[0]) throw new Error("Family profile not found.");

  await db
    .update(profiles)
    .set({ avatar: input.url })
    .where(
      and(
        eq(profiles.id, input.profileId),
        eq(profiles.householdId, input.householdId),
      ),
    );

  const previous = existing[0].avatar;
  if (
    previous !== input.url &&
    isManagedProfilePhoto(previous, input.profileId)
  ) {
    await del(previous).catch(() => undefined);
  }
}

export async function removeProfilePhotoForHousehold(input: {
  householdId: string;
  profileId: string;
}) {
  const existing = await db
    .select({ avatar: profiles.avatar })
    .from(profiles)
    .where(
      and(
        eq(profiles.id, input.profileId),
        eq(profiles.householdId, input.householdId),
      ),
    )
    .limit(1);
  if (!existing[0]) throw new Error("Family profile not found.");

  await db
    .update(profiles)
    .set({ avatar: "sparkles" })
    .where(
      and(
        eq(profiles.id, input.profileId),
        eq(profiles.householdId, input.householdId),
      ),
    );

  if (isManagedProfilePhoto(existing[0].avatar, input.profileId)) {
    await del(existing[0].avatar).catch(() => undefined);
  }
}
