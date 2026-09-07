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
  gameName: string;
  tagLine: string;
  platform: string;
  region: string;
  summonerLevel: number | null;
  profileIconId: number | null;
  lastSyncedAt: string | null;
};

export type RankedSnapshotRow = {
  id: string;
  playerId: string;
  queue: string;
  tier: string;
  division: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  capturedAt: string;
};

export type MatchRow = {
  id: string;
  riotMatchId: string;
  championId: number | null;
  championName: string;
  role: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csPerMinute: number;
  gold: number;
  goldPerMinute: number;
  damage: number;
  damagePerMinute: number;
  visionScore: number | null;
  killParticipation: number | null;
  durationSeconds: number;
  playedAt: string;
};

export type MatchTimelineMetricRow = {
  csAt10: number | null;
  csAt15: number | null;
  csDiffAt10: number | null;
  csDiffAt15: number | null;
  goldAt10: number | null;
  goldAt15: number | null;
  goldDiffAt10: number | null;
  goldDiffAt15: number | null;
  xpAt10: number | null;
  xpAt15: number | null;
  xpDiffAt10: number | null;
  xpDiffAt15: number | null;
  levelAt10: number | null;
  levelAt15: number | null;
  deathsBefore10: number | null;
  deathsBefore15: number | null;
  deaths15To25: number | null;
  deathsAfter25: number | null;
  firstDeathMinute: number | null;
  soloKills: number | null;
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
  createdAt: string;
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

export type WindowComparisonDelta = {
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  avgCsPerMinute: number;
  avgDamagePerMinute: number;
  avgGoldPerMinute: number;
};

export type WindowComparison = {
  current: TimeWindowSummary;
  previous: TimeWindowSummary | null;
  delta: WindowComparisonDelta | null;
};

export type ProgressResponse = {
  player: PlayerRow;
  rank: RankedSnapshotRow | null;
  recentForm: TimeWindowSummary;
  comparison: WindowComparison;
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
export type SyncResult = {
  newMatchesInserted: number | null;
  timelinesInserted: number | null;
  fetchedMatchIds: string[];
  syncedAt: string | null;
};
export type CoachStatus = "achieved" | "improving" | "worsening" | "stable";
export type CoachFocusCategory = "deaths" | "farm" | "champion" | "role" | "laning" | "consistency";

export type CoachGoalProgress = {
  id: string;
  metric: GoalMetric;
  label: string;
  comparison: GoalComparison;
  target: number;
  current: number | null;
  baseline: number | null;
  distanceToTarget: number | null;
  status: CoachStatus;
  progressPercent: number | null;
  role: Role | null;
  champion: string | null;
  periodGames: number;
  sampleSize: number;
  history: Array<{ matchId: string; gameCreation: string; value: number }>;
  lastMatchImpact: {
    previousValue: number | null;
    currentValue: number | null;
    delta: number | null;
    improved: boolean | null;
  };
};

export type CoachFocus = {
  category: CoachFocusCategory;
  title: string;
  current: number | null;
  target: number | null;
  baseline: number | null;
  sampleSize: number;
  trend: CoachStatus;
  distanceToTarget: number | null;
};

export type CoachResponse = {
  window: { games: number; role: Role | "ALL" };
  baseline: { games: number };
  primaryFocus: CoachFocus | null;
  secondaryFocus: CoachFocus | null;
  strength: CoachFocus | null;
  goals: CoachGoalProgress[];
  recentForm: TimeWindowSummary;
  comparison: WindowComparison;
  recommendedChampionFocus: {
    championName: string;
    games: number;
    winRate: number;
    kda: number;
    avgDeaths: number;
    avgCsPerMinute: number;
    reason: string;
    confidence: "medium" | "high";
  } | null;
};

export type ChampionDetailResponse = {
  champion: ChampionStats;
  recentMatches?: MatchRow[];
};
export type QueryParams = Record<string, string | number | boolean | null | undefined>;
