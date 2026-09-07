import { apiRequest, toWindowParams } from "./client";
import { adaptPhasesResponse } from "./adapters";
import type { WindowParams } from "@/lib/api-types";

export const getPhases = (params?: WindowParams) =>
  apiRequest("/api/performance/phases", toWindowParams(params), undefined, adaptPhasesResponse);
