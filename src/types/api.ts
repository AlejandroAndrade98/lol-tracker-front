/**
 * Frontend mirror of the backend contracts (src/contracts/api.ts).
 * Source of truth: the existing lol-tracker REST API.
 */

export type Role = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

export const ROLES: Role[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export const ROLE_LABELS: Record<Role, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

export type PlayerRow = {
  id: string;
  game_name: string;
  tag_line: string;
  platform: string;
  region: string;
  summoner_level: number | null;
  profile_icon_id: number | null;
  last_synced_at: string | null;
};

export type RankedSnapshotRow = {
  id: string;
  player_id: string;
  queue: string;
  tier: string;
  division: string;
  league_points: number;
  wins: number;
  losses: number;
  captured_at: string;
};

export type MatchRow = {
  id: string;
  riot_match_id: string;
  champion_id: number | null;
  champion_name: string;
  role: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  cs_per_minute: number;
  gold: number;
  gold_per_minute: number;
  damage: number;
  damage_per_minute: number;
  vision_score: number | null;
  kill_participation: number | null;
  duration_seconds: number;
  played_at: string;
};

export type MatchTimelineMetricRow = {
  cs_at_10: number | null;
  cs_at_15: number | null;
  cs_diff_at_10: number | null;
  cs_diff_at_15: number | null;
  gold_at_10: number | null;
  gold_at_15: number | null;
  gold_diff_at_10: number | null;
  gold_diff_at_15: number | null;
  xp_at_10: number | null;
  xp_at_15: number | null;
  xp_diff_at_10: number | null;
  xp_diff_at_15: number | null;
  level_at_10: number | null;
  level_at_15: number | null;
  deaths_before_10: number | null;
  deaths_before_15: number | null;
  deaths_15_to_25: number | null;
  deaths_after_25: number | null;
  first_death_minute: number | null;
  solo_kills: number | null;
};

export type TimeWindowSummary = {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  avgCsPerMinute: number;
  avgDamagePerMinute: number;
  avgGoldPerMinute: number;
  avgKillParticipation: number | null;
  avgVisionScorePerMinute: number | null;
};

export type InsightType = "positive" | "warning" | "suggestion";
export type Confidence = "low" | "medium" | "high";

export type Insight = {
  id: string;
  type: InsightType;
  category: string;
  title: string;
  message: string;
  evidence: string;
  sampleSize: number | null;
  confidence: Confidence;
  currentValue: number | null;
  targetValue: number | null;
  unit?: string | null;
};

export type PhaseBlock = {
  status: "strong" | "neutral" | "needs_attention" | "insufficient_data";
  games: number;
  metrics: Array<{ key: string; label: string; value: number | null; unit?: string }>;
};

export type PhaseAnalytics = {
  laning: PhaseBlock;
  midGame: PhaseBlock;
  lateGame: PhaseBlock;
};

export type SessionSummary = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  champions: string[];
  roles: string[];
  avgKda: number;
  avgDeaths: number;
  avgCsPerMinute: number;
};

export type GoalComparison = "lte" | "gte" | "lt" | "gt" | "eq";

export type GoalMetric =
  | "avgDeaths"
  | "csPerMinute"
  | "avgCsPerMinute"
  | "winRate"
  | "championPool"
  | "avgKillParticipation"
  | "kda";

export type GoalRow = {
  id: string;
  metric: GoalMetric;
  target: number;
  comparison: GoalComparison;
  role: Role | null;
  champion: string | null;
  periodGames: number;
  active: boolean;
  created_at: string;
};

export type GoalProgress = {
  goal: GoalRow;
  currentValue: number | null;
  games: number;
  achieved: boolean;
  progressPercent: number;
};

export type GoalInput = {
  metric: GoalMetric;
  target: number;
  comparison: GoalComparison;
  role: Role | null;
  champion: string | null;
  periodGames: number;
  active: boolean;
};

export type RankHistoryResponse = {
  player: PlayerRow;
  history: RankedSnapshotRow[];
};

export type RolesResponse = {
  allRoles: Record<string, TimeWindowSummary>;
  primaryRole: string | null;
};

export type ChampionStats = {
  championName: string;
  championId?: number | null;
  role: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  avgCsPerMinute: number;
  avgCsAt10: number | null;
  avgCsAt15: number | null;
  avgCsDiffAt10: number | null;
  avgCsDiffAt15: number | null;
  avgGoldDiffAt10: number | null;
  avgGoldDiffAt15: number | null;
  avgDamagePerMinute: number;
  avgGoldPerMinute: number;
  avgKillParticipation: number | null;
  avgVisionScorePerMinute: number | null;
  avgSoloKills: number | null;
  avgDeathsBefore10: number | null;
  avgDeaths15To25: number | null;
  firstBloodRate: number;
};

export type ChampionAnalyticsResponse = {
  champions: ChampionStats[];
};

export type ProgressResponse = {
  player: PlayerRow;
  rank: RankedSnapshotRow | null;
  recentForm: TimeWindowSummary;
  previousForm?: TimeWindowSummary | null;
  roles: RolesResponse;
  trends: {
    winRateDelta: number;
    killsDelta: number;
    deathsDelta: number;
    assistsDelta: number;
    kdaDelta: number;
    csPerMinuteDelta: number;
    damagePerMinuteDelta: number;
    goldPerMinuteDelta: number;
  };
  consistency: {
    deathStdDev: number;
    csPerMinuteStdDev: number;
    kdaStdDev: number;
    score: number;
  };
  bestChampions: ChampionStats[];
  weaknesses: Insight[];
  strengths: Insight[];
};

export type DeathAnalyticsResponse = {
  avgDeaths: number;
  avgDeathsBefore10: number | null;
  avgDeathsBefore15: number | null;
  avgDeaths15To25: number | null;
  avgDeathsAfter25: number | null;
  firstDeathAvgMinute: number | null;
  winRateWhenDeathsLTE5: number | null;
  winRateWhenDeaths6To8: number | null;
  winRateWhenDeathsGTE9: number | null;
  gamesByDeathBucket: {
    lte5: number;
    sixToEight: number;
    gte9: number;
  };
};

export type FarmRoleAnalytics = {
  games: number;
  avgCsPerMinute: number;
  avgCsAt10: number | null;
  avgCsAt15: number | null;
  avgCsDiffAt10: number | null;
  avgCsDiffAt15: number | null;
  winRateWhenCsPerMinuteGTE8: number | null;
  winRateWhenCsPerMinute7To8: number | null;
  winRateWhenCsPerMinuteLT7: number | null;
};

export type FarmAnalyticsResponse = {
  byRole: Record<string, FarmRoleAnalytics>;
};

export type MatchesResponse = {
  matches: MatchRow[];
};

export type MatchDetailResponse = {
  summary: MatchRow;
  playerStats: MatchRow;
  opponentStats: {
    championId: number | null;
    championName: string | null;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    cs: number | null;
    csPerMinute: number | null;
    gold: number | null;
    damage: number | null;
  };
  timelineMetrics: MatchTimelineMetricRow | null;
};

export type SessionsResponse = { sessions: SessionSummary[] };
export type InsightsResponse = { insights: Insight[] };
export type GoalsResponse = { goals: GoalRow[] };
export type GoalsProgressResponse = { goals: GoalProgress[] };
export type PhasePerformanceResponse = { phases: PhaseAnalytics };
export type PlayerResponse = { player: PlayerRow };
export type RankResponse = { rank: RankedSnapshotRow | null };
export type HealthResponse = {
  ok: boolean;
  status?: string;
  timestamp?: string;
};
export type ChampionDetailResponse = {
  champion: ChampionStats;
  recentMatches?: MatchRow[];
};
export type QueryParams = Record<string, string | number | boolean | null | undefined>;
