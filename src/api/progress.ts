import { apiRequest, toWindowParams } from "./client";
import type { ProgressResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getProgress = (params?: WindowParams) =>
  apiRequest<ProgressResponse>("/api/progress", toWindowParams(params));
