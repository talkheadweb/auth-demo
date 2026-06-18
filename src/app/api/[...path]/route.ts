/*
  Transparent proxy — forwards all /api/v1/... browser requests to the backend.

  Why this exists:
    The browser cannot store Set-Cookie from a cross-origin fetch response reliably
    across all environments. By routing browser fetches through this same-origin
    handler, the backend's Set-Cookie headers reach the browser as same-origin
    responses — no cross-origin cookie restrictions apply.

    The backend still owns ALL cookie logic (names, values, expiry, clearing).
    This proxy does nothing except forward bytes in both directions.

  Flow:
    Browser → demo.talkhead.ai/api/v1/...  (same-origin fetch)
              ↓ this handler
    Backend ← dev-api.talkhead.ai/api/v1/... (server-to-server)
              ↓ response + Set-Cookie
    Browser ← demo.talkhead.ai (Set-Cookie forwarded, browser stores it ✅)
*/

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function proxy(req: NextRequest): Promise<NextResponse> {
  const target = new URL(req.nextUrl.pathname + req.nextUrl.search, BACKEND_URL);

  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.delete("host");

  const upstream = await fetch(target.toString(), {
    method  : req.method,
    headers : forwardHeaders,
    body    : req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers();

  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    if (key.toLowerCase() === "set-cookie") return; // handled below
    responseHeaders.append(key, value);
  });

  // getSetCookie() returns each Set-Cookie header separately.
  // forEach() would join them with commas — browsers reject that as one malformed header.
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new NextResponse(upstream.body, {
    status : upstream.status,
    headers: responseHeaders,
  });
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
export const HEAD    = proxy;
