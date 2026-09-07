import { apiRequest } from "./client";
import { adaptPlayerResponse, adaptRankHistoryResponse, adaptRankResponse } from "./adapters";
import type { HealthResponse } from "@/types/api";

export const getHealth = () => apiRequest<HealthResponse>("/health");
export const getPlayer = () => apiRequest("/api/player", undefined, undefined, adaptPlayerResponse);
export const getRank = () => apiRequest("/api/rank", undefined, undefined, adaptRankResponse);
export const getRankHistory = (params?: { days?: number; all?: boolean }) =>
  apiRequest("/api/rank/history", params, undefined, adaptRankHistoryResponse);
