import { cookies } from "next/headers";
import { appConfig } from "@/lib/env";
import type { ApiSuccessResponse, User } from "@/types/auth";

// Forward all browser cookies to the backend as-is.
// The frontend never needs to know cookie names — the backend owns that entirely.
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const allCookies  = cookieStore.getAll();

  if (allCookies.length === 0) return null;

  const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/auth/me`, {
      cache  : "no-store",
      headers: { Accept: "application/json", Cookie: cookieHeader },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as ApiSuccessResponse<User>;
    return payload.data ?? null;
  } catch {
    return null;
  }
}
