"use client";

const _suffix = process.env.NODE_ENV === "production" ? "" : "_dev";
const COOKIE_NAME = `session_info${_suffix}`;

export type SessionInfo = {
  uid              : string;
  name             : string;
  email            : string;
  role             : "user" | "admin";
  profilePictureKey: string | null;
};

/**
 * Reads the JS-readable session_info cookie synchronously.
 * Returns null when the user is logged out or the cookie has expired.
 *
 * This never makes a network call — use it as a fast first check before
 * validating with /auth/me.
 */
export function getSessionInfo(): SessionInfo | null {
  if (typeof document === "undefined") return null; // SSR guard

  const match = document.cookie
    .split("; ")
    .find(row => row.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;

  try {
    const raw = match.split("=").slice(1).join("=");
    return JSON.parse(decodeURIComponent(raw)) as SessionInfo;
  } catch {
    return null;
  }
}

/** True if a session_info cookie exists (does NOT validate the actual token). */
export function isLoggedIn(): boolean {
  return getSessionInfo() !== null;
}
