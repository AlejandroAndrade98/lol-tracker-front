import { getChampion, getChampions } from "@/api/champions";
import { getCoach } from "@/api/coach";
import { getDeaths } from "@/api/deaths";
import { getFarm } from "@/api/farm";
import { getGoals, getGoalsProgress, createGoal, updateGoal, deleteGoal } from "@/api/goals";
import { getInsights } from "@/api/insights";
import { getMatch, getMatches } from "@/api/matches";
import { getPhases } from "@/api/phases";
import { API_BASE_URL } from "@/api/client";
import { getHealth, getPlayer, getRank, getRankHistory } from "@/api/player";
import { getProgress } from "@/api/progress";
import { getRoles } from "@/api/roles";
import { getSessions } from "@/api/sessions";
import { syncBackend } from "@/api/sync";
import type { LolTrackerApi } from "./api-types";

export const httpApi: LolTrackerApi = {
  getHealth,
  getPlayer,
  getRank,
  getRankHistory,
  getProgress,
  getRoles,
  getMatches,
  getMatch,
  getChampions,
  getChampion,
  getPhases,
  getDeaths,
  getFarm,
  getSessions,
  getInsights,
  getCoach,
  getGoals,
  getGoalsProgress,
  createGoal,
  updateGoal,
  deleteGoal,
  sync: syncBackend,
};

export { API_BASE_URL };
