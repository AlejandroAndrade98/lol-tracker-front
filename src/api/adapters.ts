import type {
  ChampionAnalyticsResponse,
  ChampionStats,
  Insight,
  InsightsResponse,
  MatchRow,
  MatchesResponse,
  PlayerResponse,
  PhasePerformanceResponse,
  RolesResponse,
  SessionsResponse,
  SyncResult,
  ProgressResponse,
  RankedSnapshotRow,
  RankHistoryResponse,
  RankResponse,
  Role,
  TimeWindowSummary,
} from "@/types/api";

export type RawBackendDTO = Record<string, unknown>;

type RawPlayerDTO = RawBackendDTO;
type RawRankDTO = RawBackendDTO;
type RawMatchDTO = RawBackendDTO;
type RawInsightDTO = RawBackendDTO;

export class ApiContractError extends Error {
  constructor(endpoint: string, field: string) {
    super(`Invalid response from ${endpoint}: missing or invalid ${field}.`);
    this.name = "ApiContractError";
  }
}

function record(value: unknown, endpoint: string, field = "response"): RawBackendDTO {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as RawBackendDTO;
  throw new ApiContractError(endpoint, field);
}

function requiredString(dto: RawBackendDTO, endpoint: string, ...keys: string[]): string {
  for (const key of keys) {
    const value = dto[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  throw new ApiContractError(endpoint, keys.join(" or "));
}

function optionalString(dto: RawBackendDTO, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = dto[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function requiredNumber(dto: RawBackendDTO, endpoint: string, ...keys: string[]): number {
  for (const key of keys) {
    const value = dto[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  throw new ApiContractError(endpoint, keys.join(" or "));
}

function optionalNumber(dto: RawBackendDTO, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = dto[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function requiredBoolean(dto: RawBackendDTO, endpoint: string, ...keys: string[]): boolean {
  for (const key of keys) {
    if (typeof dto[key] === "boolean") return dto[key] as boolean;
  }
  throw new ApiContractError(endpoint, keys.join(" or "));
}

function adaptPlayer(dto: RawPlayerDTO, endpoint: string) {
  const platform = requiredString(dto, endpoint, "platform", "platformRegion", "platform_region");
  return {
    id: requiredString(dto, endpoint, "id"),
    gameName: requiredString(dto, endpoint, "gameName", "game_name"),
    tagLine: requiredString(dto, endpoint, "tagLine", "tag_line"),
    platform,
    region: optionalString(dto, "region") ?? platform,
    summonerLevel: optionalNumber(dto, "summonerLevel", "summoner_level"),
    profileIconId: optionalNumber(dto, "profileIconId", "profile_icon_id"),
    lastSyncedAt: optionalString(dto, "lastSyncedAt", "last_synced_at", "updatedAt", "updated_at"),
  };
}

function adaptRank(dto: RawRankDTO, endpoint: string): RankedSnapshotRow {
  return {
    id: requiredString(dto, endpoint, "id"),
    playerId: requiredString(dto, endpoint, "playerId", "player_id"),
    queue: requiredString(dto, endpoint, "queue", "queueType", "queue_type"),
    tier: requiredString(dto, endpoint, "tier"),
    // The backend calls this field `rank`; the UI model calls it `division`.
    division: requiredString(dto, endpoint, "division", "rank"),
    leaguePoints: requiredNumber(dto, endpoint, "leaguePoints", "league_points"),
    wins: requiredNumber(dto, endpoint, "wins"),
    losses: requiredNumber(dto, endpoint, "losses"),
    capturedAt: requiredString(
      dto,
      endpoint,
      "capturedAt",
      "captured_at",
      "recordedAt",
      "recorded_at",
    ),
  };
}

function adaptSummary(value: unknown, endpoint: string): TimeWindowSummary {
  const dto = record(value, endpoint, "summary");
  return {
    games: requiredNumber(dto, endpoint, "games"),
    wins: requiredNumber(dto, endpoint, "wins"),
    losses: requiredNumber(dto, endpoint, "losses"),
    winRate: requiredNumber(dto, endpoint, "winRate"),
    avgKills: requiredNumber(dto, endpoint, "avgKills"),
    avgDeaths: requiredNumber(dto, endpoint, "avgDeaths"),
    avgAssists: requiredNumber(dto, endpoint, "avgAssists"),
    kda: requiredNumber(dto, endpoint, "kda"),
    avgCsPerMinute: requiredNumber(dto, endpoint, "avgCsPerMinute"),
    avgDamagePerMinute: requiredNumber(dto, endpoint, "avgDamagePerMinute"),
    avgGoldPerMinute: requiredNumber(dto, endpoint, "avgGoldPerMinute"),
    avgKillParticipation: optionalNumber(dto, "avgKillParticipation"),
    avgVisionScorePerMinute: optionalNumber(dto, "avgVisionScorePerMinute"),
  };
}

function adaptChampion(value: unknown, endpoint: string): ChampionStats {
  const dto = record(value, endpoint, "champion");
  return {
    championName: requiredString(dto, endpoint, "championName", "champion_name"),
    championId: optionalNumber(dto, "championId", "champion_id"),
    role: requiredString(dto, endpoint, "role"),
    games: requiredNumber(dto, endpoint, "games"),
    wins: requiredNumber(dto, endpoint, "wins"),
    losses: requiredNumber(dto, endpoint, "losses"),
    winRate: requiredNumber(dto, endpoint, "winRate"),
    avgKills: requiredNumber(dto, endpoint, "avgKills"),
    avgDeaths: requiredNumber(dto, endpoint, "avgDeaths"),
    avgAssists: requiredNumber(dto, endpoint, "avgAssists"),
    kda: requiredNumber(dto, endpoint, "kda"),
    avgCsPerMinute: requiredNumber(dto, endpoint, "avgCsPerMinute"),
    avgCsAt10: optionalNumber(dto, "avgCsAt10"),
    avgCsAt15: optionalNumber(dto, "avgCsAt15"),
    avgCsDiffAt10: optionalNumber(dto, "avgCsDiffAt10"),
    avgCsDiffAt15: optionalNumber(dto, "avgCsDiffAt15"),
    avgGoldDiffAt10: optionalNumber(dto, "avgGoldDiffAt10"),
    avgGoldDiffAt15: optionalNumber(dto, "avgGoldDiffAt15"),
    avgDamagePerMinute: requiredNumber(dto, endpoint, "avgDamagePerMinute"),
    avgGoldPerMinute: requiredNumber(dto, endpoint, "avgGoldPerMinute"),
    avgKillParticipation: optionalNumber(dto, "avgKillParticipation"),
    avgVisionScorePerMinute: optionalNumber(dto, "avgVisionScorePerMinute"),
    avgSoloKills: optionalNumber(dto, "avgSoloKills"),
    avgDeathsBefore10: optionalNumber(dto, "avgDeathsBefore10"),
    avgDeaths15To25: optionalNumber(dto, "avgDeaths15To25"),
    firstBloodRate: requiredNumber(dto, endpoint, "firstBloodRate"),
  };
}

function adaptInsight(value: unknown, endpoint: string, index: number): Insight {
  const dto = record(value, endpoint, "insight");
  const type = requiredString(dto, endpoint, "type");
  if (type !== "positive" && type !== "warning" && type !== "suggestion")
    throw new ApiContractError(endpoint, "insight.type");
  const evidence = dto["evidence"];
  const evidenceDto = evidence && typeof evidence === "object" ? (evidence as RawBackendDTO) : null;
  return {
    id:
      optionalString(dto, "id") ?? `${type}-${requiredString(dto, endpoint, "category")}-${index}`,
    type,
    category: requiredString(dto, endpoint, "category"),
    title: requiredString(dto, endpoint, "title"),
    message: requiredString(dto, endpoint, "message"),
    evidence:
      typeof evidence === "string"
        ? evidence
        : evidenceDto
          ? Object.entries(evidenceDto)
              .map(([key, entry]) => `${key}: ${String(entry)}`)
              .join(", ")
          : "No data",
    sampleSize: evidenceDto
      ? optionalNumber(evidenceDto, "games")
      : optionalNumber(dto, "sampleSize"),
    confidence: (optionalString(dto, "confidence") as Insight["confidence"] | null) ?? "low",
    currentValue: optionalNumber(dto, "currentValue"),
    targetValue: optionalNumber(dto, "targetValue"),
    unit: optionalString(dto, "unit"),
  };
}

function adaptMatch(value: unknown, endpoint: string): MatchRow {
  const dto = record(value, endpoint, "match");
  return {
    id: requiredString(dto, endpoint, "id"),
    riotMatchId: requiredString(dto, endpoint, "riotMatchId", "riot_match_id"),
    championId: optionalNumber(dto, "championId", "champion_id"),
    championName: requiredString(dto, endpoint, "championName", "champion_name"),
    role: requiredString(
      dto,
      endpoint,
      "role",
      "teamPosition",
      "team_position",
      "individualPosition",
      "individual_position",
    ),
    win: requiredBoolean(dto, endpoint, "win"),
    kills: requiredNumber(dto, endpoint, "kills"),
    deaths: requiredNumber(dto, endpoint, "deaths"),
    assists: requiredNumber(dto, endpoint, "assists"),
    cs: requiredNumber(dto, endpoint, "cs", "totalCs", "total_cs"),
    csPerMinute: requiredNumber(dto, endpoint, "csPerMinute", "cs_per_min"),
    gold: requiredNumber(dto, endpoint, "gold", "goldEarned", "gold_earned"),
    goldPerMinute: requiredNumber(dto, endpoint, "goldPerMinute", "gold_per_min"),
    damage: requiredNumber(dto, endpoint, "damage", "damageToChampions", "damage_to_champions"),
    damagePerMinute: requiredNumber(dto, endpoint, "damagePerMinute", "damage_per_min"),
    visionScore: optionalNumber(dto, "visionScore", "vision_score"),
    killParticipation: optionalNumber(dto, "killParticipation", "kill_participation"),
    durationSeconds: requiredNumber(dto, endpoint, "durationSeconds", "game_duration_seconds"),
    playedAt: requiredString(dto, endpoint, "playedAt", "gameCreation", "game_creation"),
  };
}

export function adaptPlayerResponse(raw: unknown): PlayerResponse {
  const dto = record(raw, "/api/player");
  return {
    player: adaptPlayer(record(dto["player"] ?? dto, "/api/player", "player"), "/api/player"),
  };
}

export function adaptRankResponse(raw: unknown): RankResponse {
  const dto = record(raw, "/api/rank");
  const value = dto["rank"] && typeof dto["rank"] === "object" ? dto["rank"] : dto;
  return { rank: adaptRank(record(value, "/api/rank", "rank"), "/api/rank") };
}

export function adaptRankHistoryResponse(raw: unknown): RankHistoryResponse {
  const dto = record(raw, "/api/rank/history");
  const history = dto["history"];
  if (!Array.isArray(history)) throw new ApiContractError("/api/rank/history", "history");
  return {
    player: adaptPlayer(record(dto["player"], "/api/rank/history", "player"), "/api/rank/history"),
    history: history.map((item) =>
      adaptRank(record(item, "/api/rank/history", "history item"), "/api/rank/history"),
    ),
  };
}

export function adaptProgressResponse(raw: unknown): ProgressResponse {
  const dto = record(raw, "/api/progress");
  const roles = record(dto["roles"], "/api/progress", "roles");
  const allRoles = record(roles["allRoles"], "/api/progress", "roles.allRoles");
  const trends = record(dto["trends"], "/api/progress", "trends");
  const consistency = record(dto["consistency"], "/api/progress", "consistency");
  const rank =
    dto["rank"] === null
      ? null
      : adaptRank(record(dto["rank"], "/api/progress", "rank"), "/api/progress");
  const insights = (value: unknown, name: string) =>
    Array.isArray(value)
      ? value.map((item, index) => adaptInsight(item, "/api/progress", index))
      : [];
  return {
    player: adaptPlayer(record(dto["player"], "/api/progress", "player"), "/api/progress"),
    rank,
    recentForm: adaptSummary(dto["recentForm"], "/api/progress"),
    previousForm: dto["previousForm"] ? adaptSummary(dto["previousForm"], "/api/progress") : null,
    roles: {
      allRoles: Object.fromEntries(
        Object.entries(allRoles).map(([key, value]) => [key, adaptSummary(value, "/api/progress")]),
      ),
      primaryRole: optionalString(roles, "primaryRole"),
    },
    trends: {
      winRateDelta: requiredNumber(trends, "/api/progress", "winRateDelta"),
      killsDelta: requiredNumber(trends, "/api/progress", "killsDelta"),
      deathsDelta: requiredNumber(trends, "/api/progress", "deathsDelta"),
      assistsDelta: requiredNumber(trends, "/api/progress", "assistsDelta"),
      kdaDelta: requiredNumber(trends, "/api/progress", "kdaDelta"),
      csPerMinuteDelta: requiredNumber(trends, "/api/progress", "csPerMinuteDelta"),
      damagePerMinuteDelta: requiredNumber(trends, "/api/progress", "damagePerMinuteDelta"),
      goldPerMinuteDelta: requiredNumber(trends, "/api/progress", "goldPerMinuteDelta"),
    },
    consistency: {
      deathStdDev: requiredNumber(consistency, "/api/progress", "deathStdDev"),
      csPerMinuteStdDev: requiredNumber(consistency, "/api/progress", "csPerMinuteStdDev"),
      kdaStdDev: requiredNumber(consistency, "/api/progress", "kdaStdDev"),
      score: requiredNumber(consistency, "/api/progress", "score"),
    },
    bestChampions: Array.isArray(dto["bestChampions"])
      ? dto["bestChampions"].map((item) => adaptChampion(item, "/api/progress"))
      : [],
    weaknesses: insights(dto["weaknesses"], "weaknesses"),
    strengths: insights(dto["strengths"], "strengths"),
  };
}

export function adaptMatchesResponse(raw: unknown): MatchesResponse {
  const values = Array.isArray(raw) ? raw : record(raw, "/api/matches")["matches"];
  if (!Array.isArray(values)) throw new ApiContractError("/api/matches", "matches");
  return { matches: values.map((item) => adaptMatch(item, "/api/matches")) };
}

export function adaptChampionsResponse(raw: unknown): ChampionAnalyticsResponse {
  const dto = record(raw, "/api/champions");
  if (!Array.isArray(dto["champions"])) throw new ApiContractError("/api/champions", "champions");
  return { champions: dto["champions"].map((item) => adaptChampion(item, "/api/champions")) };
}

export function adaptInsightsResponse(raw: unknown): InsightsResponse {
  const dto = record(raw, "/api/insights");
  if (!Array.isArray(dto["insights"])) throw new ApiContractError("/api/insights", "insights");
  return {
    insights: dto["insights"].map((item, index) => adaptInsight(item, "/api/insights", index)),
  };
}

export function adaptRolesResponse(raw: unknown): RolesResponse {
  const dto = record(raw, "/api/roles");
  const allRoles = record(dto["allRoles"], "/api/roles", "allRoles");
  return {
    allRoles: Object.fromEntries(
      Object.entries(allRoles).map(([role, value]) => [role, adaptSummary(value, "/api/roles")]),
    ),
    primaryRole: optionalString(dto, "primaryRole"),
  };
}

export function adaptPhasesResponse(raw: unknown): PhasePerformanceResponse {
  const dto = record(raw, "/api/performance/phases");
  const phases = record(dto["phases"], "/api/performance/phases", "phases");
  const adaptPhase = (value: unknown, key: string) => {
    const phase = record(value, "/api/performance/phases", key);
    const games = requiredNumber(phase, "/api/performance/phases", "games");
    return {
      status: games > 0 ? ("neutral" as const) : ("insufficient_data" as const),
      games,
      metrics: Object.entries(phase)
        .filter(
          ([metric, value]) => metric !== "games" && (typeof value === "number" || value === null),
        )
        .map(([metric, value]) => ({
          key: metric,
          label: metric,
          value: typeof value === "number" ? value : null,
        })),
    };
  };
  return {
    phases: {
      laning: adaptPhase(phases["laning"], "laning"),
      midGame: adaptPhase(phases["midGame"], "midGame"),
      lateGame: adaptPhase(phases["lateGame"], "lateGame"),
    },
  };
}

export function adaptSessionsResponse(raw: unknown): SessionsResponse {
  const dto = record(raw, "/api/sessions");
  if (!Array.isArray(dto["sessions"])) throw new ApiContractError("/api/sessions", "sessions");
  return {
    sessions: dto["sessions"].map((value, index) => {
      const session = record(value, "/api/sessions", "session");
      const startedAt = requiredString(session, "/api/sessions", "startedAt", "startTime");
      const endedAt = requiredString(session, "/api/sessions", "endedAt", "endTime");
      const avgKills = requiredNumber(session, "/api/sessions", "avgKills");
      const avgDeaths = requiredNumber(session, "/api/sessions", "avgDeaths");
      const avgAssists = requiredNumber(session, "/api/sessions", "avgAssists");
      return {
        id: optionalString(session, "id") ?? `session-${index}-${startedAt}`,
        startedAt,
        endedAt,
        durationMinutes: Math.max(
          0,
          Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 60000),
        ),
        games: requiredNumber(session, "/api/sessions", "games"),
        wins: requiredNumber(session, "/api/sessions", "wins"),
        losses: requiredNumber(session, "/api/sessions", "losses"),
        winRate: requiredNumber(session, "/api/sessions", "winRate"),
        champions: Array.isArray(session["champions"])
          ? session["champions"].filter((item): item is string => typeof item === "string")
          : [],
        roles: Array.isArray(session["roles"])
          ? session["roles"].filter((item): item is string => typeof item === "string")
          : [],
        avgKda: (avgKills + avgAssists) / Math.max(1, avgDeaths),
        avgDeaths,
        avgCsPerMinute: requiredNumber(session, "/api/sessions", "avgCsPerMinute"),
      };
    }),
  };
}

export function adaptSyncResult(raw: unknown): SyncResult {
  const dto = record(raw, "/api/sync");
  const fetchedMatchIds = Array.isArray(dto["fetchedMatchIds"])
    ? dto["fetchedMatchIds"].filter((value): value is string => typeof value === "string")
    : [];
  return {
    newMatchesInserted: optionalNumber(dto, "newMatchesInserted"),
    timelinesInserted: optionalNumber(dto, "timelinesInserted"),
    fetchedMatchIds,
    syncedAt: optionalString(dto, "syncedAt", "updatedAt", "updated_at"),
  };
}
