/*
  OAuth callback route handler — NOT a page.

  Flow:
    1. Backend OAuth callback creates a one-time code in Redis and redirects here:
         /auth/callback?code=<uuid>
    2. This handler calls POST /api/v1/auth/social/claim (server-side fetch).
    3. The backend sets httpOnly cookies in its response (same as regular login).
    4. This handler forwards those Set-Cookie headers verbatim in its own response.
    5. Browser receives Set-Cookie from the app domain → cookies stored correctly.
*/

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Derives the public-facing origin from the incoming request.
 *
 * Behind a reverse proxy (Nginx, Caddy, etc.) `request.url` resolves to the
 * internal address (http://localhost:3000). The proxy always forwards the real
 * host and protocol via standard headers, so we read those instead.
 *
 *   x-forwarded-proto  →  https          (set by proxy)
 *   x-forwarded-host   →  demo.talkhead.ai  (set by proxy)
 *
 * Falls back to the raw request origin for local dev (no proxy, no headers).
 */
function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const host  = request.headers.get("x-forwarded-host")  ?? request.headers.get("host") ?? request.nextUrl.host;
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  const code   = request.nextUrl.searchParams.get("code");
  const error  = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("social_error", error ?? "Google authentication failed. Please try again.");
    return NextResponse.redirect(loginUrl.toString());
  }

  // Exchange code for session — server-to-server call (proxy rewrites don't apply here)
  let claimResponse: Response;
  try {
    claimResponse = await fetch(`${BACKEND_URL}/api/v1/auth/social/claim`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ code }),
      redirect: "manual",
    });
  } catch {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("social_error", "Network error during authentication. Please try again.");
    return NextResponse.redirect(loginUrl.toString());
  }

  if (!claimResponse.ok) {
    const body = await claimResponse.json().catch(() => ({}));
    const msg  = (body as { message?: string }).message ?? "Authentication failed. Please try again.";
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("social_error", msg);
    return NextResponse.redirect(loginUrl.toString());
  }

  // Forward the backend's Set-Cookie headers in our redirect response.
  // The browser binds cookies to the domain that issued this response.
  const profileRedirect = NextResponse.redirect(new URL("/profile", origin).toString());

  const setCookieHeaders = claimResponse.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookieHeaders) {
    profileRedirect.headers.append("Set-Cookie", cookie);
  }

  return profileRedirect;
}
