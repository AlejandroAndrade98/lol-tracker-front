import { apiRequest } from "./client";
import type { MatchDetailResponse, MatchesResponse, Role } from "@/types/api";

export const getMatches = (params?: { limit?: number; role?: Role | null }) =>
  apiRequest<MatchesResponse>("/api/matches", {
    limit: params?.limit,
    role: params?.role ?? undefined,
  });

export const getMatch = (matchId: string) =>
  apiRequest<MatchDetailResponse>(`/api/matches/${encodeURIComponent(matchId)}`);
