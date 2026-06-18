import { cookies } from "next/headers";
import { appConfig } from "@/lib/env";
import type { ApiSuccessResponse, User } from "@/types/auth";

// Mirror the backend cookie-name logic: _dev suffix in non-production environments.
const suffix = process.env.NODE_ENV === "production" ? "" : "_dev";
export const COOKIE_NAMES = {
  accessToken : `access_token${suffix}`,
  refreshToken: `refresh_token${suffix}`,
  sessionInfo : `session_info${suffix}`,
} as const;

const buildCookieHeader = (cookieMap: Record<string, string | undefined>) =>
  Object.entries(cookieMap)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore  = await cookies();
  const accessToken  = cookieStore.get(COOKIE_NAMES.accessToken)?.value;
  const refreshToken = cookieStore.get(COOKIE_NAMES.refreshToken)?.value;

  if (!accessToken && !refreshToken) return null;

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/auth/me`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: buildCookieHeader({
          [COOKIE_NAMES.accessToken] : accessToken,
          [COOKIE_NAMES.refreshToken]: refreshToken,
        }),
      },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as ApiSuccessResponse<User>;
    return payload.data ?? null;
  } catch {
    return null;
  }
}
