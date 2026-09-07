import { apiRequest, toWindowParams } from "./client";
import { adaptProgressResponse } from "./adapters";
import type { WindowParams } from "@/lib/api-types";

export const getProgress = (params?: WindowParams) =>
  apiRequest("/api/progress", toWindowParams(params), undefined, adaptProgressResponse);
