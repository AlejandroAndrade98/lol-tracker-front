import type { QueryParams } from "@/types/api";
import { ApiError } from "@/lib/api-types";
import { recordSuccessfulApiFetch } from "@/lib/api-activity";

const DEFAULT_TIMEOUT_MS = 12_000;

export type ApiRequestOptions = { timeoutMs?: number };

export const API_BASE_URL = normalizeBaseUrl(
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:3000",
);

export const USE_MOCK_DATA =
  ((import.meta.env["VITE_USE_MOCK_DATA"] as string | undefined) ?? "false").toLowerCase() ===
  "true";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function qs(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

function parseErrorBody(body: unknown): { code: string; message: string } | null {
  if (!body || typeof body !== "object") return null;
  const maybe = body as { error?: { code?: unknown; message?: unknown }; message?: unknown };
  if (maybe.error && typeof maybe.error === "object") {
    return {
      code: typeof maybe.error.code === "string" ? maybe.error.code : "http_error",
      message:
        typeof maybe.error.message === "string"
          ? maybe.error.message
          : "The API returned an error.",
    };
  }
  if (typeof maybe.message === "string") return { code: "http_error", message: maybe.message };
  return null;
}

function safeJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  params?: QueryParams,
  init?: RequestInit,
  adapt?: (raw: unknown) => T,
  options?: ApiRequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${API_BASE_URL}${path}${qs(params)}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const body = safeJson(await response.text());

    if (!response.ok) {
      const apiError = parseErrorBody(body);
      throw new ApiError(
        apiError?.message ?? "The API request failed.",
        apiError?.code ?? "http_error",
        response.status,
      );
    }

    const result = adapt ? adapt(body) : (body as T);
    recordSuccessfulApiFetch();
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The API took too long to respond.", "timeout", 0);
    }
    throw new ApiError("Could not connect to the API.", "network_error", 0);
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function toWindowParams(params?: {
  games?: number;
  role?: string | null;
  includeSupport?: boolean;
}): QueryParams {
  return {
    games: params?.games,
    role: params?.role ?? undefined,
    includeSupport: params?.includeSupport,
  };
}
