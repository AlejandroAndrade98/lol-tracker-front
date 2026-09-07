import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { WindowParams } from "@/lib/api-types";
import type { GoalInput, Role } from "@/types/api";

export function useCoach(
  params: { games?: number; role?: Role | "ALL"; baselineGames?: number } = {},
) {
  return useQuery({ queryKey: ["coach", params], queryFn: () => api.getCoach(params) });
}
export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: () => api.getHealth(), retry: 1 });
}

export function usePlayer() {
  return useQuery({ queryKey: ["player"], queryFn: () => api.getPlayer() });
}

export function useRank() {
  return useQuery({ queryKey: ["rank"], queryFn: () => api.getRank() });
}

export function useRankHistory(days: number | "all" = 90) {
  return useQuery({
    queryKey: ["rank-history", days],
    queryFn: () => api.getRankHistory(days === "all" ? { all: true } : { days }),
  });
}

export function useProgress(params: WindowParams = {}) {
  return useQuery({
    queryKey: ["progress", params],
    queryFn: () => api.getProgress(params),
  });
}

export function useRoles(params: WindowParams = {}) {
  return useQuery({ queryKey: ["roles", params], queryFn: () => api.getRoles(params) });
}

export function useMatches(params: { limit?: number; role?: Role | null } = {}) {
  return useQuery({ queryKey: ["matches", params], queryFn: () => api.getMatches(params) });
}

export function useMatch(matchId: string) {
  return useQuery({ queryKey: ["match", matchId], queryFn: () => api.getMatch(matchId) });
}

export function useChampions(params: WindowParams = {}) {
  return useQuery({ queryKey: ["champions", params], queryFn: () => api.getChampions(params) });
}

export function useChampion(championName: string, params: WindowParams = {}) {
  return useQuery({
    queryKey: ["champion", championName, params],
    queryFn: () => api.getChampion(championName, params),
  });
}

export function usePhases(params: WindowParams = {}) {
  return useQuery({ queryKey: ["phases", params], queryFn: () => api.getPhases(params) });
}

export function useDeaths(params: WindowParams = {}) {
  return useQuery({ queryKey: ["deaths", params], queryFn: () => api.getDeaths(params) });
}

export function useFarm(params: WindowParams = {}) {
  return useQuery({ queryKey: ["farm", params], queryFn: () => api.getFarm(params) });
}

export function useSessions(days = 30) {
  return useQuery({ queryKey: ["sessions", days], queryFn: () => api.getSessions({ days }) });
}

export function useInsights(params: WindowParams = {}) {
  return useQuery({ queryKey: ["insights", params], queryFn: () => api.getInsights(params) });
}

export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: () => api.getGoals() });
}

export function useGoalsProgress() {
  return useQuery({ queryKey: ["goals-progress"], queryFn: () => api.getGoalsProgress() });
}

export function useGoalMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["goals-progress"] });
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  const create = useMutation({
    mutationFn: (input: GoalInput) => api.createGoal(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GoalInput> }) =>
      api.updateGoal(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteGoal(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export async function refreshActiveApiQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries();
  await queryClient.refetchQueries({ type: "active" });
}

export function useSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.sync(),
    onSuccess: () => refreshActiveApiQueries(qc),
  });
}
