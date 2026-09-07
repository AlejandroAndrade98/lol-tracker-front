import { adaptCoachResponse } from "./adapters";
import { apiRequest } from "./client";
import type { CoachResponse, Role } from "@/types/api";

export const getCoach = (params?: {
  games?: number;
  role?: Role | "ALL";
  baselineGames?: number;
}) => apiRequest<CoachResponse>("/api/coach", params, undefined, adaptCoachResponse);
