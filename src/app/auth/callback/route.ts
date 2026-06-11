/*
  OAuth callback route handler — NOT a page.

  Flow:
    1. Backend OAuth callback creates a one-time code in Redis and redirects here:
         /auth/callback?code=<uuid>
    2. This handler calls POST /api/v1/auth/social/claim (server-side fetch).
    3. The backend sets httpOnly cookies in its response (same as regular login).
    4. This handler forwards those Set-Cookie headers verbatim in its own response.
    5. Browser receives Set-Cookie from localhost:3000 → cookies stored for localhost.

  Why forwarding works:
    Express does not set a Domain attribute on cookies by default. A domainless
    Set-Cookie header is always bound to the response origin by the browser. Since
    the browser receives this response from localhost:3000 (not dev-api.talkhead.ai),
    the cookies are stored for localhost:3000 — even though the backend generated them.
*/

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function GET(request: NextRequest) {
  const code  = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  const loginUrl = new URL("/login", request.url);

  if (error || !code) {
    loginUrl.searchParams.set("social_error", error ?? "Google authentication failed. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  // Exchange code for session — server-to-server (proxy rewrites don't apply here)
  let claimResponse: Response;
  try {
    claimResponse = await fetch(`${BACKEND_URL}/api/v1/auth/social/claim`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ code }),
      // Do not follow redirects automatically
      redirect: "manual",
    });
  } catch {
    loginUrl.searchParams.set("social_error", "Network error during authentication. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  if (!claimResponse.ok) {
    const body = await claimResponse.json().catch(() => ({}));
    const msg  = (body as { message?: string }).message ?? "Authentication failed. Please try again.";
    loginUrl.searchParams.set("social_error", msg);
    return NextResponse.redirect(loginUrl);
  }

  // Forward the backend's Set-Cookie headers in our redirect response.
  // The browser will bind them to localhost:3000 because that's who is responding.
  const profileRedirect = NextResponse.redirect(new URL("/profile", request.url));

  const setCookieHeaders = claimResponse.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookieHeaders) {
    profileRedirect.headers.append("Set-Cookie", cookie);
  }

  return profileRedirect;
}
