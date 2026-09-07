import { apiRequest } from "./client";
import type { GoalInput, GoalRow, GoalsProgressResponse, GoalsResponse } from "@/types/api";

export const getGoals = () => apiRequest<GoalsResponse>("/api/goals");
export const getGoalsProgress = () => apiRequest<GoalsProgressResponse>("/api/goals/progress");
export const createGoal = (input: GoalInput) =>
  apiRequest<{ goal: GoalRow }>("/api/goals", undefined, {
    method: "POST",
    body: JSON.stringify(input),
  });
export const updateGoal = (id: string, input: Partial<GoalInput>) =>
  apiRequest<{ goal: GoalRow }>(`/api/goals/${encodeURIComponent(id)}`, undefined, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
export const deleteGoal = (id: string) =>
  apiRequest<{ ok: true }>(`/api/goals/${encodeURIComponent(id)}`, undefined, { method: "DELETE" });
