import { NextResponse } from "next/server";
import { googleAuthUrl, googleOAuthState, appBaseUrl } from "@/lib/google/oauth";
import { getCurrentHousehold, getSession } from "@/lib/household";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const base = appBaseUrl();
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", base));
  }
  const household = await getCurrentHousehold();
  if (!household) {
    return NextResponse.redirect(new URL("/onboarding", base));
  }
  const allowed = await checkRateLimit("calendar-connect", household.id, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.redirect(
      new URL("/settings/calendar?error=rate-limit", base),
    );
  }
  try {
    const state = googleOAuthState(household.id);
    return NextResponse.redirect(googleAuthUrl(state));
  } catch {
    return NextResponse.redirect(
      new URL("/settings/calendar?error=google-not-configured", base),
    );
  }
}
