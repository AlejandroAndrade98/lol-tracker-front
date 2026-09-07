import type {
  ChampionAnalyticsResponse,
  ChampionDetailResponse,
  DeathAnalyticsResponse,
  FarmAnalyticsResponse,
  GoalInput,
  GoalRow,
  GoalsProgressResponse,
  GoalsResponse,
  HealthResponse,
  InsightsResponse,
  MatchDetailResponse,
  MatchesResponse,
  PhasePerformanceResponse,
  PlayerResponse,
  ProgressResponse,
  RankHistoryResponse,
  RankResponse,
  Role,
  RolesResponse,
  SessionsResponse,
} from "@/types/api";

export type WindowParams = { games?: number; role?: Role | null; includeSupport?: boolean };

export interface LolTrackerApi {
  getHealth(): Promise<HealthResponse>;
  getPlayer(): Promise<PlayerResponse>;
  getRank(): Promise<RankResponse>;
  getRankHistory(params?: { days?: number; all?: boolean }): Promise<RankHistoryResponse>;
  getProgress(params?: WindowParams): Promise<ProgressResponse>;
  getRoles(params?: WindowParams): Promise<RolesResponse>;
  getMatches(params?: { limit?: number; role?: Role | null }): Promise<MatchesResponse>;
  getMatch(matchId: string): Promise<MatchDetailResponse>;
  getChampions(params?: WindowParams): Promise<ChampionAnalyticsResponse>;
  getChampion(championName: string, params?: WindowParams): Promise<ChampionDetailResponse>;
  getPhases(params?: WindowParams): Promise<PhasePerformanceResponse>;
  getDeaths(params?: WindowParams): Promise<DeathAnalyticsResponse>;
  getFarm(params?: WindowParams): Promise<FarmAnalyticsResponse>;
  getSessions(params?: { days?: number }): Promise<SessionsResponse>;
  getInsights(params?: WindowParams): Promise<InsightsResponse>;
  getGoals(): Promise<GoalsResponse>;
  getGoalsProgress(): Promise<GoalsProgressResponse>;
  createGoal(input: GoalInput): Promise<{ goal: GoalRow }>;
  updateGoal(id: string, input: Partial<GoalInput>): Promise<{ goal: GoalRow }>;
  deleteGoal(id: string): Promise<{ ok: true }>;
  sync(): Promise<{ ok: true; syncedAt: string }>;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "unknown_error", status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}
