import { adaptSyncResult } from "./adapters";
import { apiRequest } from "./client";

export const syncBackend = () =>
  apiRequest("/api/sync", undefined, { method: "POST" }, adaptSyncResult, { timeoutMs: 90_000 });
