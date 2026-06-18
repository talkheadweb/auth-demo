"use client";

export type SessionInfo = {
  uid              : string;
  name             : string;
  email            : string;
  role             : "user" | "admin";
  profilePictureKey: string | null;
};

// Exact cookie name derived from NODE_ENV — matches the backend's naming logic.
// Using exact match (with "=") prevents "session_info_dev" matching in production
// and vice versa, which avoids a redirect loop when switching between environments.
const _suffix    = process.env.NODE_ENV === "production" ? "" : "_dev";
const COOKIE_KEY = `session_info${_suffix}=`;

export function getSessionInfo(): SessionInfo | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find(row => row.startsWith(COOKIE_KEY));

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
