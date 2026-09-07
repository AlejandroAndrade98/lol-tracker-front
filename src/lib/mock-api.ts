import type { LolTrackerApi, WindowParams } from "./api-types";
import {
  buildInsights,
  buildSessions,
  championStats,
  mockGoals,
  mockMatches,
  mockPlayer,
  mockRank,
  mockRankHistory,
  summarize,
  type MockMatch,
} from "@/mocks/data";
import type {
  ChampionDetailResponse,
  CoachGoalProgress,
  CoachResponse,
  DeathAnalyticsResponse,
  FarmAnalyticsResponse,
  FarmRoleAnalytics,
  GoalInput,
  GoalProgress,
  GoalRow,
  PhasePerformanceResponse,
  Role,
  RolesResponse,
  TimeWindowSummary,
} from "@/types/api";

const LATENCY = 220;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function avgOrNull(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function filterMatches(p?: WindowParams): MockMatch[] {
  let list = mockMatches;
  if (p?.role) list = list.filter((m) => m.role === p.role);
  else if (p?.includeSupport === false) list = list.filter((m) => m.role !== "UTILITY");
  return list.slice(0, p?.games ?? 20);
}

function winRateOrNull(ms: MockMatch[]): number | null {
  if (!ms.length) return null;
  return round((ms.filter((m) => m.win).length / ms.length) * 100, 1);
}

function delta(current: number, previous: number) {
  return round(current - previous);
}

function emptySummary(): TimeWindowSummary {
  return {
    games: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgKills: 0,
    avgDeaths: 0,
    avgAssists: 0,
    kda: 0,
    avgCsPerMinute: 0,
    avgDamagePerMinute: 0,
    avgGoldPerMinute: 0,
    avgKillParticipation: null,
    avgVisionScorePerMinute: null,
  };
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return round(Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length));
}

function rolesBreakdown(matches: MockMatch[]): RolesResponse {
  const allRoles: Record<string, TimeWindowSummary> = {};
  for (const m of matches) {
    if (!allRoles[m.role]) {
      allRoles[m.role] = summarize(matches.filter((x) => x.role === m.role));
    }
  }
  const primaryRole =
    Object.entries(allRoles).sort((a, b) => b[1].games - a[1].games)[0]?.[0] ?? null;
  return { allRoles, primaryRole };
}

let goals: GoalRow[] = [...mockGoals];

function goalProgress(goal: GoalRow): GoalProgress {
  let ms = mockMatches;
  if (goal.role) ms = ms.filter((m) => m.role === goal.role);
  if (goal.champion) ms = ms.filter((m) => m.championName === goal.champion);
  ms = ms.slice(0, goal.periodGames);
  const s = summarize(ms);

  let currentValue: number | null = null;
  if (!ms.length) currentValue = null;
  else if (goal.metric === "avgDeaths") currentValue = s.avgDeaths;
  else if (goal.metric === "winRate") currentValue = s.winRate;
  else if (goal.metric === "kda") currentValue = s.kda;
  else if (goal.metric === "avgKillParticipation") currentValue = s.avgKillParticipation;
  else if (goal.metric === "championPool")
    currentValue = new Set(ms.map((m) => m.championName)).size;
  else currentValue = s.avgCsPerMinute;

  const achieved =
    currentValue === null
      ? false
      : goal.comparison === "lte"
        ? currentValue <= goal.target
        : goal.comparison === "lt"
          ? currentValue < goal.target
          : goal.comparison === "gte"
            ? currentValue >= goal.target
            : goal.comparison === "gt"
              ? currentValue > goal.target
              : currentValue === goal.target;

  const progressPercent =
    currentValue === null
      ? 0
      : goal.comparison === "lte" || goal.comparison === "lt"
        ? Math.max(0, Math.min(100, round((goal.target / Math.max(currentValue, 0.01)) * 100, 0)))
        : Math.max(0, Math.min(100, round((currentValue / Math.max(goal.target, 0.01)) * 100, 0)));

  return { goal, currentValue, games: ms.length, achieved, progressPercent };
}

function buildPhasePerformance(matches: MockMatch[]): PhasePerformanceResponse {
  const timelineMatches = matches.filter((m) => m.timeline);
  const avgCsDiff10 = avgOrNull(timelineMatches.map((m) => m.timeline?.csDiffAt10 ?? null));
  const avgCsDiff15 = avgOrNull(timelineMatches.map((m) => m.timeline?.csDiffAt15 ?? null));
  const avgGoldDiff10 = avgOrNull(timelineMatches.map((m) => m.timeline?.goldDiffAt10 ?? null));
  const avgGoldDiff15 = avgOrNull(timelineMatches.map((m) => m.timeline?.goldDiffAt15 ?? null));
  const avgXpDiff10 = avgOrNull(timelineMatches.map((m) => m.timeline?.xpDiffAt10 ?? null));
  const avgXpDiff15 = avgOrNull(timelineMatches.map((m) => m.timeline?.xpDiffAt15 ?? null));
  const deathsBefore10 = avgOrNull(timelineMatches.map((m) => m.timeline?.deathsBefore10 ?? null));
  const deathsBefore15 = avgOrNull(timelineMatches.map((m) => m.timeline?.deathsBefore15 ?? null));
  const midDeaths = avgOrNull(timelineMatches.map((m) => m.timeline?.deaths15To25 ?? null));
  const lateDeaths = avgOrNull(timelineMatches.map((m) => m.timeline?.deathsAfter25 ?? null));
  const summary = summarize(matches);
  const enough = timelineMatches.length >= 10;

  return {
    phases: {
      laning: {
        status: !enough
          ? "insufficient_data"
          : (avgCsDiff10 ?? 0) >= 5 && (deathsBefore10 ?? 9) <= 0.7
            ? "strong"
            : (avgCsDiff10 ?? 0) < -5 || (deathsBefore10 ?? 0) > 1.1
              ? "needs_attention"
              : "neutral",
        games: timelineMatches.length,
        metrics: [
          { key: "csDiff10", label: "CS diff @10", value: avgCsDiff10, unit: "cs" },
          { key: "csDiff15", label: "CS diff @15", value: avgCsDiff15, unit: "cs" },
          { key: "goldDiff10", label: "Gold diff @10", value: avgGoldDiff10, unit: "g" },
          { key: "goldDiff15", label: "Gold diff @15", value: avgGoldDiff15, unit: "g" },
          { key: "xpDiff10", label: "XP diff @10", value: avgXpDiff10, unit: "xp" },
          { key: "xpDiff15", label: "XP diff @15", value: avgXpDiff15, unit: "xp" },
          { key: "deathsBefore10", label: "Deaths before 10", value: deathsBefore10 },
          { key: "deathsBefore15", label: "Deaths before 15", value: deathsBefore15 },
        ],
      },
      midGame: {
        status: !enough
          ? "insufficient_data"
          : (midDeaths ?? 9) <= 1.4
            ? "strong"
            : (midDeaths ?? 0) >= 2
              ? "needs_attention"
              : "neutral",
        games: timelineMatches.length,
        metrics: [
          { key: "deaths15To25", label: "Deaths 15-25", value: midDeaths },
          {
            key: "kp",
            label: "Kill participation",
            value: summary.avgKillParticipation,
            unit: "%",
          },
          { key: "damage", label: "Damage/min", value: summary.avgDamagePerMinute },
        ],
      },
      lateGame: {
        status: !enough
          ? "insufficient_data"
          : (lateDeaths ?? 9) <= 0.9
            ? "strong"
            : (lateDeaths ?? 0) >= 1.5
              ? "needs_attention"
              : "neutral",
        games: timelineMatches.length,
        metrics: [
          { key: "lateDeaths", label: "Deaths after 25", value: lateDeaths },
          {
            key: "kp",
            label: "Kill participation",
            value: summary.avgKillParticipation,
            unit: "%",
          },
          { key: "damage", label: "Damage/min", value: summary.avgDamagePerMinute },
        ],
      },
    },
  };
}

function coachMetric(goal: GoalRow, matches: MockMatch[]): number | null {
  if (!matches.length) return null;
  const summary = summarize(matches);
  if (goal.metric === "avgDeaths") return summary.avgDeaths;
  if (goal.metric === "csPerMinute" || goal.metric === "avgCsPerMinute")
    return summary.avgCsPerMinute;
  if (goal.metric === "winRate") return summary.winRate;
  if (goal.metric === "kda") return summary.kda;
  if (goal.metric === "avgKillParticipation") return summary.avgKillParticipation;
  return new Set(matches.map((match) => match.championName)).size;
}

function scopedCoachMatches(goal: GoalRow, role: Role | "ALL"): MockMatch[] {
  const selectedRole = goal.role ?? (role === "ALL" ? null : role);
  return mockMatches.filter(
    (match) =>
      (selectedRole === null || match.role === selectedRole) &&
      (goal.champion === null || match.championName === goal.champion),
  );
}

function mockCoachGoal(
  goal: GoalRow,
  role: Role | "ALL",
  baselineGames: number,
): CoachGoalProgress {
  const ordered = [...scopedCoachMatches(goal, role)].reverse();
  const currentMatches = ordered.slice(-goal.periodGames);
  const history = ordered
    .flatMap((_, index) => {
      if (index < goal.periodGames - 1) return [];
      const window = ordered.slice(index - goal.periodGames + 1, index + 1);
      const match = ordered[index];
      const value = coachMetric(goal, window);
      return match && value !== null
        ? [{ matchId: match.riotMatchId, gameCreation: match.playedAt, value }]
        : [];
    })
    .slice(-30);
  const current = coachMetric(goal, currentMatches);
  const prior = ordered
    .slice(0, Math.max(0, ordered.length - currentMatches.length))
    .slice(-baselineGames);
  const baseline = coachMetric(goal, prior);
  const previous = history.at(-2)?.value ?? null;
  const latest = history.at(-1)?.value ?? current;
  const delta = previous === null || latest === null ? null : round(latest - previous);
  const lowerIsBetter = goal.comparison === "lte" || goal.comparison === "lt";
  const improved =
    delta === null ? null : delta === 0 ? false : lowerIsBetter ? delta < 0 : delta > 0;
  const distance =
    current === null
      ? null
      : Math.max(0, lowerIsBetter ? current - goal.target : goal.target - current);
  const baselineDistance =
    baseline === null
      ? null
      : Math.max(0, lowerIsBetter ? baseline - goal.target : goal.target - baseline);
  const progressPercent =
    distance === null || baselineDistance === null
      ? null
      : baselineDistance === 0
        ? distance === 0
          ? 100
          : 0
        : Math.max(
            0,
            Math.min(100, round(((baselineDistance - distance) / baselineDistance) * 100)),
          );
  const achieved = distance === 0;
  return {
    id: goal.id,
    metric: goal.metric,
    label:
      goal.metric === "avgDeaths"
        ? "Deaths/game"
        : goal.metric === "csPerMinute" || goal.metric === "avgCsPerMinute"
          ? "CS/min"
          : goal.metric,
    comparison: goal.comparison,
    target: goal.target,
    current,
    baseline,
    distanceToTarget: distance,
    status: achieved
      ? "achieved"
      : improved === true
        ? "improving"
        : improved === false && delta !== 0
          ? "worsening"
          : "stable",
    progressPercent,
    role: goal.role ?? (role === "ALL" ? null : role),
    champion: goal.champion,
    periodGames: goal.periodGames,
    sampleSize: currentMatches.length,
    history,
    lastMatchImpact: { previousValue: previous, currentValue: latest, delta, improved },
  };
}

function mockCoach(params?: {
  games?: number;
  role?: Role | "ALL";
  baselineGames?: number;
}): CoachResponse {
  const role = params?.role ?? "MIDDLE";
  const baselineGames = params?.baselineGames ?? 100;
  const activeGoals = goals
    .filter((goal) => goal.active && (role === "ALL" || goal.role === null || goal.role === role))
    .map((goal) => mockCoachGoal(goal, role, baselineGames));
  const actionable = activeGoals.filter(
    (goal) => goal.current !== null && goal.distanceToTarget !== 0,
  );
  const primary = actionable[0] ?? null;
  const secondary = actionable[1] ?? null;
  const roleMatches =
    role === "ALL" ? mockMatches : mockMatches.filter((match) => match.role === role);
  const champions = championStats(roleMatches.slice(0, params?.games ?? 20));
  const champion =
    champions.filter((item) => item.games >= 10).sort((a, b) => b.winRate - a.winRate)[0] ?? null;
  const toFocus = (goal: CoachGoalProgress) => ({
    category: goal.metric === "avgDeaths" ? ("deaths" as const) : ("farm" as const),
    title: goal.label,
    current: goal.current,
    target: goal.target,
    baseline: goal.baseline,
    sampleSize: goal.sampleSize,
    trend: goal.status,
    distanceToTarget: goal.distanceToTarget,
  });
  return {
    window: { games: Math.min(params?.games ?? 20, roleMatches.length), role },
    baseline: { games: baselineGames },
    primaryFocus: primary ? toFocus(primary) : null,
    secondaryFocus: secondary ? toFocus(secondary) : null,
    strength: champion
      ? {
          category: "champion",
          title: champion.championName + " is the strongest reliable sample",
          current: champion.winRate,
          target: null,
          baseline: null,
          sampleSize: champion.games,
          trend: "stable",
          distanceToTarget: null,
        }
      : null,
    goals: activeGoals,
    recentForm: summarize(roleMatches.slice(0, params?.games ?? 20)),
    recommendedChampionFocus: champion
      ? {
          championName: champion.championName,
          games: champion.games,
          winRate: champion.winRate,
          kda: champion.kda,
          avgDeaths: champion.avgDeaths,
          avgCsPerMinute: champion.avgCsPerMinute,
          reason: "Strongest reliable sample currently",
          confidence: champion.games >= 20 ? "high" : "medium",
        }
      : null,
  };
}

export const mockApi: LolTrackerApi = {
  getHealth: () =>
    delay({ ok: true as const, status: "mock", timestamp: new Date().toISOString() }),
  getPlayer: () => delay({ player: mockPlayer }),
  getRank: () => delay({ rank: mockRank ?? null }),

  getRankHistory: (p) => {
    const history = p?.all
      ? mockRankHistory
      : mockRankHistory.filter(
          (r) => new Date(r.capturedAt).getTime() >= Date.now() - (p?.days ?? 90) * 86400000,
        );
    return delay({ player: mockPlayer, history });
  },

  getProgress: (p) => {
    const size = p?.games ?? 20;
    const pool = p?.role ? mockMatches.filter((m) => m.role === p.role) : mockMatches;
    const current = pool.slice(0, size);
    const previous = pool.slice(size, size * 2);
    const recentForm = summarize(current);
    const previousForm = previous.length ? summarize(previous) : null;
    const base = previousForm ?? emptySummary();

    return delay({
      player: mockPlayer,
      rank: mockRank ?? null,
      recentForm,
      previousForm,
      roles: rolesBreakdown(current),
      trends: {
        winRateDelta: delta(recentForm.winRate, base.winRate),
        killsDelta: delta(recentForm.avgKills, base.avgKills),
        deathsDelta: delta(recentForm.avgDeaths, base.avgDeaths),
        assistsDelta: delta(recentForm.avgAssists, base.avgAssists),
        kdaDelta: delta(recentForm.kda, base.kda),
        csPerMinuteDelta: delta(recentForm.avgCsPerMinute, base.avgCsPerMinute),
        damagePerMinuteDelta: delta(recentForm.avgDamagePerMinute, base.avgDamagePerMinute),
        goldPerMinuteDelta: delta(recentForm.avgGoldPerMinute, base.avgGoldPerMinute),
      },
      consistency: {
        deathStdDev: stdDev(current.map((m) => m.deaths)),
        csPerMinuteStdDev: stdDev(current.map((m) => m.csPerMinute)),
        kdaStdDev: stdDev(current.map((m) => (m.kills + m.assists) / Math.max(1, m.deaths))),
        score: Math.max(0, Math.min(100, round(100 - stdDev(current.map((m) => m.deaths)) * 9, 0))),
      },
      bestChampions: championStats(current)
        .filter((c) => c.games >= 3)
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 5),
      weaknesses: buildInsights(current).filter((i) => i.type === "warning"),
      strengths: buildInsights(current).filter((i) => i.type === "positive"),
    });
  },

  getRoles: (p) => delay(rolesBreakdown(filterMatches({ ...p, role: null }))),

  getMatches: (p) => {
    let list = mockMatches;
    if (p?.role) list = list.filter((m) => m.role === p.role);
    return delay({ matches: list.slice(0, p?.limit ?? 20) });
  },

  getMatch: (matchId) => {
    const match =
      mockMatches.find((m) => m.id === matchId || m.riotMatchId === matchId) ?? mockMatches[0]!;
    return delay({
      summary: match,
      playerStats: match,
      opponentStats: {
        championId: null,
        championName: match.opponent,
        kills: Math.max(0, match.deaths - 1),
        deaths: match.kills,
        assists: Math.max(1, match.assists - 2),
        cs: match.timeline?.csAt15 ? Math.round(match.cs * 0.95) : null,
        csPerMinute: Math.max(0, match.csPerMinute - 0.3),
        gold: Math.round(match.gold * 0.97),
        damage: Math.round(match.damage * 0.92),
      },
      timelineMetrics: match.timeline,
    });
  },

  getChampions: (p) => delay({ champions: championStats(filterMatches(p)) }),

  getChampion: (championName, p) => {
    const stats = championStats(filterMatches(p));
    const champion =
      stats.find((c) => c.championName.toLowerCase() === championName.toLowerCase()) ?? stats[0]!;
    const recentMatches = mockMatches
      .filter((m) => m.championName === champion.championName)
      .slice(0, 12);
    const response: ChampionDetailResponse = { champion, recentMatches };
    return delay(response);
  },

  getPhases: (p) => delay(buildPhasePerformance(filterMatches(p))),

  getDeaths: (p) => {
    const ms = filterMatches(p);
    const lte5 = ms.filter((m) => m.deaths <= 5);
    const six = ms.filter((m) => m.deaths >= 6 && m.deaths <= 8);
    const gte9 = ms.filter((m) => m.deaths >= 9);
    const res: DeathAnalyticsResponse = {
      avgDeaths: summarize(ms).avgDeaths,
      avgDeathsBefore10: avgOrNull(ms.map((m) => m.timeline?.deathsBefore10 ?? null)),
      avgDeathsBefore15: avgOrNull(ms.map((m) => m.timeline?.deathsBefore15 ?? null)),
      avgDeaths15To25: avgOrNull(ms.map((m) => m.timeline?.deaths15To25 ?? null)),
      avgDeathsAfter25: avgOrNull(ms.map((m) => m.timeline?.deathsAfter25 ?? null)),
      firstDeathAvgMinute: avgOrNull(ms.map((m) => m.timeline?.firstDeathMinute ?? null)),
      winRateWhenDeathsLTE5: winRateOrNull(lte5),
      winRateWhenDeaths6To8: winRateOrNull(six),
      winRateWhenDeathsGTE9: winRateOrNull(gte9),
      gamesByDeathBucket: { lte5: lte5.length, sixToEight: six.length, gte9: gte9.length },
    };
    return delay(res);
  },

  getFarm: (p) => {
    const size = p?.games ?? 40;
    const byRole: Record<string, FarmRoleAnalytics> = {};
    const roles: Role[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
    for (const role of roles) {
      const ms = mockMatches.filter((m) => m.role === role).slice(0, size);
      if (!ms.length) continue;
      byRole[role] = {
        games: ms.length,
        avgCsPerMinute: summarize(ms).avgCsPerMinute,
        avgCsAt10: avgOrNull(ms.map((m) => m.timeline?.csAt10 ?? null)),
        avgCsAt15: avgOrNull(ms.map((m) => m.timeline?.csAt15 ?? null)),
        avgCsDiffAt10: avgOrNull(ms.map((m) => m.timeline?.csDiffAt10 ?? null)),
        avgCsDiffAt15: avgOrNull(ms.map((m) => m.timeline?.csDiffAt15 ?? null)),
        winRateWhenCsPerMinuteGTE8: winRateOrNull(ms.filter((m) => m.csPerMinute >= 8)),
        winRateWhenCsPerMinute7To8: winRateOrNull(
          ms.filter((m) => m.csPerMinute >= 7 && m.csPerMinute < 8),
        ),
        winRateWhenCsPerMinuteLT7: winRateOrNull(ms.filter((m) => m.csPerMinute < 7)),
      };
    }
    return delay({ byRole });
  },

  getSessions: (p) => {
    const cutoff = Date.now() - (p?.days ?? 30) * 86400000;
    const ms = mockMatches.filter((m) => new Date(m.playedAt).getTime() >= cutoff);
    return delay({ sessions: buildSessions(ms) });
  },

  getInsights: (p) => delay({ insights: buildInsights(filterMatches(p)) }),
  getCoach: (params) => delay(mockCoach(params)),
  getGoals: () => delay({ goals }),
  getGoalsProgress: () => delay({ goals: goals.map(goalProgress) }),

  createGoal: (input: GoalInput) => {
    const goal: GoalRow = {
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
    goals = [goal, ...goals];
    return delay({ goal });
  },

  updateGoal: (id, input) => {
    goals = goals.map((g) => (g.id === id ? { ...g, ...input } : g));
    const goal = goals.find((g) => g.id === id)!;
    return delay({ goal });
  },

  deleteGoal: (id) => {
    goals = goals.filter((g) => g.id !== id);
    return delay({ ok: true as const });
  },

  sync: () =>
    delay({
      newMatchesInserted: 0,
      timelinesInserted: 0,
      fetchedMatchIds: [],
      syncedAt: new Date().toISOString(),
    }),
};
