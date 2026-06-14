import type { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "@/types/auth";

export type ApiMeta = {
  page      : number;
  limit     : number;
  total     : number;
  totalPages: number;
};

export type ApiListResult<T> = {
  data: T[];
  meta: ApiMeta;
};

export class ApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const CLIENT_BASE = "/api/v1";

const joinUrl = (path: string) => {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${CLIENT_BASE}${suffix}`;
};

const isJsonResponse = (response: Response) =>
  response.headers.get("content-type")?.includes("application/json") ?? false;

export async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (isJsonResponse(response)) {
    return (await response.json()) as ApiResponse<T>;
  }

  if (response.ok) {
    return {
      success: true,
      statusCode: response.status,
      message: "Request completed successfully.",
    };
  }

  return {
    success: false,
    statusCode: response.status,
    message: response.statusText || "Request failed.",
  };
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(joinUrl(path), {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });

  const payload = await parseApiResponse<T>(response);

  if (!response.ok || !payload.success) {
    const errorPayload = payload as ApiErrorResponse;
    throw new ApiError(
      errorPayload.message || "Request failed.",
      errorPayload.statusCode || response.status,
      errorPayload.errorMessages?.map((item) => item.message) ?? [],
    );
  }

  return payload.data as T;
}

export async function apiRequestList<T>(path: string, init: RequestInit = {}): Promise<ApiListResult<T>> {
  const response = await fetch(joinUrl(path), {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });

  const payload = await parseApiResponse<T[]>(response);

  if (!response.ok || !payload.success) {
    const errorPayload = payload as ApiErrorResponse;
    throw new ApiError(
      errorPayload.message || "Request failed.",
      errorPayload.statusCode || response.status,
      errorPayload.errorMessages?.map((item) => item.message) ?? [],
    );
  }

  const ok = payload as ApiSuccessResponse<T[]> & { meta?: ApiMeta };
  return {
    data: ok.data ?? [],
    meta: ok.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
  };
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.details.length > 0
      ? `${error.message} ${error.details.join(" ")}`.trim()
      : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
