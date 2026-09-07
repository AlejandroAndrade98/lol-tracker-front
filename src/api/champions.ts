import { apiRequest, toWindowParams } from "./client";
import type { ChampionAnalyticsResponse, ChampionDetailResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getChampions = (params?: WindowParams) =>
  apiRequest<ChampionAnalyticsResponse>("/api/champions", toWindowParams(params));

export const getChampion = (championName: string, params?: WindowParams) =>
  apiRequest<ChampionDetailResponse>(
    `/api/champions/${encodeURIComponent(championName)}`,
    toWindowParams(params),
  );
