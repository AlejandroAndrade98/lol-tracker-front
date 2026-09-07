import { apiRequest } from "./client";
import { adaptMatchesResponse } from "./adapters";
import type { MatchDetailResponse, Role } from "@/types/api";

export const getMatches = (params?: { limit?: number; role?: Role | null }) =>
  apiRequest(
    "/api/matches",
    { limit: params?.limit, role: params?.role ?? undefined },
    undefined,
    adaptMatchesResponse,
  );

export const getMatch = (matchId: string) =>
  apiRequest<MatchDetailResponse>(`/api/matches/${encodeURIComponent(matchId)}`);
