import { z } from "zod";
import { deleteNap } from "@/lib/naps/store";
import {
  handleMobileError,
  mobileJson,
  requireMobileHousehold,
} from "@/lib/mobile/http";

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
