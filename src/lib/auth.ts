import { cookies } from "next/headers";
import { appConfig } from "@/lib/env";
import type { ApiSuccessResponse, User } from "@/types/auth";

const buildCookieHeader = (cookieMap: Record<string, string | undefined>) =>
  Object.entries(cookieMap)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/auth/me`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: buildCookieHeader({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiSuccessResponse<User>;
    return payload.data ?? null;
  } catch {
    return null;
  }
}
