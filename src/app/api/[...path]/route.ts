/*
  Full proxy route handler — replaces next.config.ts rewrites().

  Why rewrites() doesn't work for Set-Cookie:
    Next.js rewrites() only rewrites the URL. It does NOT forward response headers
    from the upstream backend to the browser. So when the authenticate middleware
    silently refreshes an access token and calls res.cookie(), that Set-Cookie header
    is swallowed by the rewrite layer and the browser never receives it.

  This handler is a proper HTTP proxy:
    - Forwards the request (method, headers, body, cookies) to the backend.
    - Forwards ALL response headers — including Set-Cookie — back to the browser.
    - Streams the response body through unchanged.

  Mounted at /api/[...path], so /api/v1/auth/me → BACKEND_URL/api/v1/auth/me.
*/

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function proxy(req: NextRequest): Promise<NextResponse> {
  // Reconstruct the full backend URL from the incoming path + query string
  const incoming = req.nextUrl;
  const target   = new URL(incoming.pathname + incoming.search, BACKEND_URL);

  // Forward all request headers except host (host must match the backend)
  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.delete("host");

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const upstream = await fetch(target.toString(), {
    method : req.method,
    headers: forwardHeaders,
    body,
    redirect: "manual",   // don't follow redirects — pass them through to the browser
  });

  // Copy all upstream response headers (including Set-Cookie) into our response
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    // next/server strips some headers automatically; skip internal Next.js ones
    if (key.toLowerCase() === "transfer-encoding") return;
    responseHeaders.append(key, value);
  });

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
