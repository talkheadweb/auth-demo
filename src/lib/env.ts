const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export const appConfig = {
  appName   : process.env.NEXT_PUBLIC_APP_NAME ?? "Talkhead Auth Demo",
  apiUrl,
  apiBaseUrl: `${apiUrl}/api/v1`,
} as const;
