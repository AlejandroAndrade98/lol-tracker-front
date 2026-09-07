import { apiRequest } from "./client";
import { adaptSessionsResponse } from "./adapters";

export const getSessions = (params?: { days?: number }) =>
  apiRequest("/api/sessions", { days: params?.days }, undefined, adaptSessionsResponse);
