import { apiRequest } from "./client";

export const syncBackend = () =>
  apiRequest<{ ok: true; syncedAt: string }>("/api/sync", undefined, { method: "POST" });
