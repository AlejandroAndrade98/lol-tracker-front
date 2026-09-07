import { apiRequest, toWindowParams } from "./client";
import type { FarmAnalyticsResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getFarm = (params?: WindowParams) =>
  apiRequest<FarmAnalyticsResponse>("/api/farm", toWindowParams(params));
