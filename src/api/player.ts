import { apiRequest } from "./client";
import type { HealthResponse } from "@/types/api";
import { adaptPlayerResponse, adaptRankHistoryResponse, adaptRankResponse } from "./adapters";

export const getHealth = () =>
  apiRequest<HealthResponse>("/health", undefined, undefined, undefined, { timeoutMs: 30_000 });
export const getPlayer = () => apiRequest("/api/player", undefined, undefined, adaptPlayerResponse);
export const getRank = () => apiRequest("/api/rank", undefined, undefined, adaptRankResponse);
export const getRankHistory = (params?: { days?: number; all?: boolean }) =>
  apiRequest("/api/rank/history", params, undefined, adaptRankHistoryResponse);
