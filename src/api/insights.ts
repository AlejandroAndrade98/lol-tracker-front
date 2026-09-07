import { apiRequest, toWindowParams } from "./client";
import { adaptInsightsResponse } from "./adapters";
import type { WindowParams } from "@/lib/api-types";

export const getInsights = (params?: WindowParams) =>
  apiRequest("/api/insights", toWindowParams(params), undefined, adaptInsightsResponse);
