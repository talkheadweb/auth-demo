export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Talkhead Auth Demo",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:9000/api/v1",
} as const;
