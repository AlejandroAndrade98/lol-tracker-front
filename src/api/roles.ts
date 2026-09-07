import { apiRequest, toWindowParams } from "./client";
import { adaptRolesResponse } from "./adapters";
import type { WindowParams } from "@/lib/api-types";

export const getRoles = (params?: WindowParams) =>
  apiRequest("/api/roles", toWindowParams(params), undefined, adaptRolesResponse);
