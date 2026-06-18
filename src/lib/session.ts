"use client";

export type SessionInfo = {
  uid              : string;
  name             : string;
  email            : string;
  role             : "user" | "admin";
  profilePictureKey: string | null;
};

/**
 * Reads the JS-readable session_info cookie set by the backend.
 * The frontend does not need to know the exact cookie name — it finds any
 * cookie whose name starts with "session_info" (backend owns the naming).
 */
export function getSessionInfo(): SessionInfo | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find(row => row.startsWith("session_info"));

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
