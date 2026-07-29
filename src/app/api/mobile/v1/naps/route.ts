import { z } from "zod";
import {
  createManualNap,
  endNap,
  endNapForProfile,
  fetchTodayNaps,
  serializeNap,
  startNap,
} from "@/lib/naps/store";
import {
  handleMobileError,
  mobileJson,
  parseJsonBody,
  requireMobileHousehold,
} from "@/lib/mobile/http";

const isoDate = z.string().datetime();

export async function GET() {
  try {
    const household = await requireMobileHousehold();
    const { localDate, childProfiles, naps } = await fetchTodayNaps(household);
    return mobileJson({
      localDate,
      childProfiles,
      naps: naps.map(serializeNap),
    });
  } catch (error) {
    return handleMobileError(error);
  }
}

export async function POST(request: Request) {
  try {
    const household = await requireMobileHousehold();
    const input = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("start"),
          profileId: z.string().uuid(),
        }),
        z.object({
          action: z.literal("end"),
          profileId: z.string().uuid().optional(),
          napId: z.string().uuid().optional(),
        }),
        z.object({
          action: z.literal("create"),
          profileId: z.string().uuid(),
          startedAt: isoDate,
          endedAt: isoDate.nullable().optional(),
        }),
      ])
      .parse(await parseJsonBody(request));

    if (input.action === "start") {
      const id = await startNap(household, input.profileId);
      return mobileJson({ id });
    }

    if (input.action === "create") {
      const id = await createManualNap(
        household,
        input.profileId,
        new Date(input.startedAt),
        input.endedAt ? new Date(input.endedAt) : null,
      );
      return mobileJson({ id });
    }

    if (input.napId) {
      await endNap(household, input.napId);
    } else {
      await endNapForProfile(
        household,
        z.string().uuid().parse(input.profileId),
      );
    }
    return mobileJson({ ok: true });
  } catch (error) {
    return handleMobileError(error);
  }
}
