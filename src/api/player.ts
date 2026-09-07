import { apiRequest } from "./client";
import type {
  HealthResponse,
  PlayerResponse,
  RankResponse,
  RankHistoryResponse,
} from "@/types/api";

export const getHealth = () => apiRequest<HealthResponse>("/health");
export const getPlayer = () => apiRequest<PlayerResponse>("/api/player");
export const getRank = () => apiRequest<RankResponse>("/api/rank");
export const getRankHistory = (params?: { days?: number; all?: boolean }) =>
  apiRequest<RankHistoryResponse>("/api/rank/history", params);
