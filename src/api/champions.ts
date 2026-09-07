import { apiRequest, toWindowParams } from "./client";
import { adaptChampionsResponse } from "./adapters";
import type { ChampionDetailResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getChampions = (params?: WindowParams) =>
  apiRequest("/api/champions", toWindowParams(params), undefined, adaptChampionsResponse);

export const getChampion = (championName: string, params?: WindowParams) =>
  apiRequest<ChampionDetailResponse>(
    `/api/champions/${encodeURIComponent(championName)}`,
    toWindowParams(params),
  );
