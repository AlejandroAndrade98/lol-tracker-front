import type { LolTrackerApi } from "./api-types";
import { httpApi } from "./http-api";
import { mockApi } from "./mock-api";
import { USE_MOCK_DATA } from "@/api/client";

export const api: LolTrackerApi = USE_MOCK_DATA ? mockApi : httpApi;

export { ApiError } from "./api-types";
export { API_BASE_URL, USE_MOCK_DATA } from "@/api/client";
