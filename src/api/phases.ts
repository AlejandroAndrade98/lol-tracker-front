import { apiRequest, toWindowParams } from "./client";
import type { PhasePerformanceResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getPhases = (params?: WindowParams) =>
  apiRequest<PhasePerformanceResponse>("/api/performance/phases", toWindowParams(params));
