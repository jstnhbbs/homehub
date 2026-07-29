import { z } from "zod";
import {
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
      .object({
        action: z.enum(["start", "end"]),
        profileId: z.string().uuid().optional(),
        napId: z.string().uuid().optional(),
      })
      .parse(await parseJsonBody(request));

    if (input.action === "start") {
      const profileId = z.string().uuid().parse(input.profileId);
      const id = await startNap(household, profileId);
      return mobileJson({ id });
    }

    if (input.napId) {
      await endNap(household, z.string().uuid().parse(input.napId));
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
