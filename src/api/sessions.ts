import { apiRequest } from "./client";
import type { SessionsResponse } from "@/types/api";

export const getSessions = (params?: { days?: number }) =>
  apiRequest<SessionsResponse>("/api/sessions", { days: params?.days });
