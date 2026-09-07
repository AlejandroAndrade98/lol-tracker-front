import { apiRequest, toWindowParams } from "./client";
import type { InsightsResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getInsights = (params?: WindowParams) =>
  apiRequest<InsightsResponse>("/api/insights", toWindowParams(params));
