import { apiRequest, toWindowParams } from "./client";
import type { DeathAnalyticsResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getDeaths = (params?: WindowParams) =>
  apiRequest<DeathAnalyticsResponse>("/api/deaths", toWindowParams(params));
