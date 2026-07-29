import { z } from "zod";
import { deleteNap, updateNapTimes } from "@/lib/naps/store";
import {
  handleMobileError,
  mobileJson,
  parseJsonBody,
  requireMobileHousehold,
} from "@/lib/mobile/http";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const household = await requireMobileHousehold();
    const { id } = await context.params;
    const input = z
      .object({
        startedAt: z.string().datetime(),
        endedAt: z.string().datetime().nullable().optional(),
      })
      .parse(await parseJsonBody(request));

    await updateNapTimes(
      household,
      z.string().uuid().parse(id),
      new Date(input.startedAt),
      input.endedAt ? new Date(input.endedAt) : null,
    );
    return mobileJson({ ok: true });
  } catch (error) {
    return handleMobileError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const household = await requireMobileHousehold();
    const { id } = await context.params;
    await deleteNap(household, z.string().uuid().parse(id));
    return mobileJson({ ok: true });
  } catch (error) {
    return handleMobileError(error);
  }
}
