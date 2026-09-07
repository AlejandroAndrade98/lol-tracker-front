import { apiRequest, toWindowParams } from "./client";
import type { RolesResponse } from "@/types/api";
import type { WindowParams } from "@/lib/api-types";

export const getRoles = (params?: WindowParams) =>
  apiRequest<RolesResponse>("/api/roles", toWindowParams(params));
