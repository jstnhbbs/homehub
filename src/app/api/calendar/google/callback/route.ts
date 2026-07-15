import { NextResponse } from "next/server";
import { connectGoogleCalendar } from "@/lib/google/calendar";
import { appBaseUrl, verifyGoogleOAuthState } from "@/lib/google/oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const base = appBaseUrl();

  if (error || !code || !state) {
    return NextResponse.redirect(
      new URL("/settings/calendar?error=google-auth-denied", base),
    );
  }

  try {
    const { householdId } = verifyGoogleOAuthState(state);
    await connectGoogleCalendar({ householdId, code });
    return NextResponse.redirect(
      new URL("/settings/calendar?connected=google", base),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/settings/calendar?error=google-connect-failed", base),
    );
  }
}
