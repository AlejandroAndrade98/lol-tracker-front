import type {
  ChampionStats,
  GoalRow,
  Insight,
  MatchRow,
  MatchTimelineMetricRow,
  PlayerRow,
  RankedSnapshotRow,
  Role,
  SessionSummary,
  TimeWindowSummary,
} from "@/types/api";

/** Deterministic pseudo-random generator so mock data is stable across renders. */
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rnd = makeRandom(20260906);

export const mockPlayer: PlayerRow = {
  id: "player-1",
  game_name: "Jordan Belfort",
  tag_line: "LAN29",
  platform: "LA1",
  region: "LAN",
  summoner_level: 412,
  profile_icon_id: 4568,
  last_synced_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
};

const MID_CHAMPS = ["Ahri", "Orianna", "Syndra", "Viktor", "Sylas", "Akali", "Zed"];
const OTHER_CHAMPS: Record<Exclude<Role, "MIDDLE">, string[]> = {
  TOP: ["Camille", "Jax", "Gnar"],
  JUNGLE: ["Viego", "Lee Sin"],
  BOTTOM: ["Ezreal", "Jinx", "Kai'Sa"],
  UTILITY: ["Lulu", "Thresh"],
};

const ROLE_WEIGHTS: Array<[Role, number]> = [
  ["MIDDLE", 0.68],
  ["TOP", 0.12],
  ["BOTTOM", 0.1],
  ["UTILITY", 0.06],
  ["JUNGLE", 0.04],
];

function pickRole(): Role {
  const r = rnd();
  let acc = 0;
  for (const [role, w] of ROLE_WEIGHTS) {
    acc += w;
    if (r <= acc) return role;
  }
  return "MIDDLE";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

function round(n: number, d = 1) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export type MockMatch = MatchRow & { timeline: MatchTimelineMetricRow | null; opponent: string };

function buildMatches(count: number): MockMatch[] {
  const matches: MockMatch[] = [];
  let cursor = Date.now() - 5 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const role = pickRole();
    const champion =
      role === "MIDDLE" ? pick(MID_CHAMPS) : pick(OTHER_CHAMPS[role as Exclude<Role, "MIDDLE">]);
    const opponent = role === "MIDDLE" ? pick(MID_CHAMPS) : pick(MID_CHAMPS);
    // Slight improvement trend towards the most recent games.
    const recencyBoost = (count - i) / count;
    const win = rnd() < 0.44 + recencyBoost * 0.12;
    const duration = Math.round(1500 + rnd() * 1200);
    const minutes = duration / 60;
    const deaths = Math.max(0, Math.round(4 + rnd() * 6 - recencyBoost * 1.6));
    const kills = Math.max(0, Math.round((win ? 7 : 4) + rnd() * 5));
    const assists = Math.max(0, Math.round(5 + rnd() * 8));
    const csPerMinute = round(6.2 + rnd() * 2.4 + recencyBoost * 0.5, 2);
    const cs = Math.round(csPerMinute * minutes);
    const goldPerMinute = round(360 + rnd() * 120, 0);
    const damagePerMinute = round(520 + rnd() * 340, 0);

    // Support games have no farm-relevant timeline data.
    const hasTimeline = rnd() > 0.12;
    const timeline: MatchTimelineMetricRow | null = hasTimeline
      ? {
          cs_at_10: role === "UTILITY" ? null : Math.round(60 + rnd() * 25),
          cs_at_15: role === "UTILITY" ? null : Math.round(100 + rnd() * 40),
          cs_diff_at_10: role === "UTILITY" ? null : Math.round(-14 + rnd() * 28),
          cs_diff_at_15: role === "UTILITY" ? null : Math.round(-20 + rnd() * 40),
          gold_at_10: Math.round(3100 + rnd() * 700),
          gold_at_15: Math.round(5200 + rnd() * 1200),
          gold_diff_at_10: Math.round(-400 + rnd() * 900),
          gold_diff_at_15: Math.round(-700 + rnd() * 1500),
          xp_at_10: Math.round(4200 + rnd() * 700),
          xp_at_15: Math.round(7200 + rnd() * 1200),
          xp_diff_at_10: Math.round(-350 + rnd() * 700),
          xp_diff_at_15: Math.round(-600 + rnd() * 1200),
          level_at_10: 8 + Math.round(rnd()),
          level_at_15: 11 + Math.round(rnd()),
          deaths_before_10: Math.round(rnd() * 2),
          deaths_before_15: Math.round(rnd() * 3),
          deaths_15_to_25: round(rnd() * 3, 0),
          deaths_after_25: Math.round(rnd() * 2),
          first_death_minute: round(6 + rnd() * 14, 1),
          solo_kills: Math.round(rnd() * 2),
        }
      : null;

    matches.push({
      id: `m-${i}`,
      riot_match_id: `LA1_${5300000000 + i}`,
      champion_id: null,
      champion_name: champion,
      role,
      win,
      kills,
      deaths,
      assists,
      cs,
      cs_per_minute: csPerMinute,
      gold: Math.round(goldPerMinute * minutes),
      gold_per_minute: goldPerMinute,
      damage: Math.round(damagePerMinute * minutes),
      damage_per_minute: damagePerMinute,
      vision_score: round(18 + rnd() * 24, 0),
      kill_participation: round(0.45 + rnd() * 0.3, 2),
      duration_seconds: duration,
      played_at: new Date(cursor).toISOString(),
      timeline,
      opponent,
    });

    // Games are grouped in sessions: short gaps inside a session, long gaps between.
    cursor -= duration * 1000 + (rnd() < 0.25 ? 20 : 3) * 3600 * 1000 * (0.3 + rnd());
  }

  return matches;
}

export const mockMatches: MockMatch[] = buildMatches(220);

const TIERS = ["SILVER", "GOLD", "PLATINUM", "EMERALD"];
const DIVISIONS = ["IV", "III", "II", "I"];

function buildRankHistory(): RankedSnapshotRow[] {
  const history: RankedSnapshotRow[] = [];
  let ordinal = 4 * 4 + 1; // Gold IV-ish start
  let lp = 40;
  let wins = 150;
  let losses = 168;
  const days = 120;

  for (let i = days; i >= 0; i--) {
    const won = rnd() < 0.53;
    if (won) {
      lp += 18 + Math.round(rnd() * 6);
      wins += 1;
    } else {
      lp -= 16 + Math.round(rnd() * 6);
      losses += 1;
    }
    while (lp >= 100) {
      lp -= 100;
      ordinal += 1;
    }
    while (lp < 0) {
      lp += 100;
      ordinal = Math.max(0, ordinal - 1);
    }
    const tierIndex = Math.min(TIERS.length - 1, Math.floor(ordinal / 4));
    const divisionIndex = ordinal % 4;

    history.push({
      id: `snap-${i}`,
      player_id: mockPlayer.id,
      queue: "RANKED_SOLO_5x5",
      tier: TIERS[tierIndex]!,
      division: DIVISIONS[divisionIndex]!,
      league_points: lp,
      wins,
      losses,
      captured_at: new Date(Date.now() - i * 24 * 3600 * 1000).toISOString(),
    });
  }

  return history;
}

export const mockRankHistory = buildRankHistory();
export const mockRank = mockRankHistory[mockRankHistory.length - 1];

function avg(values: Array<number | null | undefined>): number {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return 0;
  return round(nums.reduce((a, b) => a + b, 0) / nums.length, 2);
}

function avgOrNull(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return round(nums.reduce((a, b) => a + b, 0) / nums.length, 2);
}

export function summarize(matches: MockMatch[]): TimeWindowSummary {
  const wins = matches.filter((m) => m.win).length;
  const kills = avg(matches.map((m) => m.kills));
  const deaths = avg(matches.map((m) => m.deaths));
  const assists = avg(matches.map((m) => m.assists));
  return {
    games: matches.length,
    wins,
    losses: matches.length - wins,
    winRate: matches.length ? round((wins / matches.length) * 100, 1) : 0,
    avgKills: kills,
    avgDeaths: deaths,
    avgAssists: assists,
    kda: round((kills + assists) / Math.max(1, deaths), 2),
    avgCsPerMinute: avg(matches.map((m) => m.cs_per_minute)),
    avgDamagePerMinute: avg(matches.map((m) => m.damage_per_minute)),
    avgGoldPerMinute: avg(matches.map((m) => m.gold_per_minute)),
    avgKillParticipation: avgOrNull(matches.map((m) => m.kill_participation)),
    avgVisionScorePerMinute: avgOrNull(
      matches.map((m) => (m.vision_score ? m.vision_score / (m.duration_seconds / 60) : null)),
    ),
  };
}

export function championStats(matches: MockMatch[]): ChampionStats[] {
  const groups = new Map<string, MockMatch[]>();
  for (const m of matches) {
    const key = `${m.champion_name}|${m.role}`;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }

  return [...groups.entries()]
    .map(([key, ms]) => {
      const [championName, role] = key.split("|") as [string, string];
      const wins = ms.filter((m) => m.win).length;
      const kills = avg(ms.map((m) => m.kills));
      const deaths = avg(ms.map((m) => m.deaths));
      const assists = avg(ms.map((m) => m.assists));
      return {
        championName,
        role,
        games: ms.length,
        wins,
        losses: ms.length - wins,
        winRate: round((wins / ms.length) * 100, 1),
        avgKills: kills,
        avgDeaths: deaths,
        avgAssists: assists,
        kda: round((kills + assists) / Math.max(1, deaths), 2),
        avgCsPerMinute: avg(ms.map((m) => m.cs_per_minute)),
        avgCsAt10: avgOrNull(ms.map((m) => m.timeline?.cs_at_10 ?? null)),
        avgCsAt15: avgOrNull(ms.map((m) => m.timeline?.cs_at_15 ?? null)),
        avgCsDiffAt10: avgOrNull(ms.map((m) => m.timeline?.cs_diff_at_10 ?? null)),
        avgCsDiffAt15: avgOrNull(ms.map((m) => m.timeline?.cs_diff_at_15 ?? null)),
        avgGoldDiffAt10: avgOrNull(ms.map((m) => m.timeline?.gold_diff_at_10 ?? null)),
        avgGoldDiffAt15: avgOrNull(ms.map((m) => m.timeline?.gold_diff_at_15 ?? null)),
        avgDamagePerMinute: avg(ms.map((m) => m.damage_per_minute)),
        avgGoldPerMinute: avg(ms.map((m) => m.gold_per_minute)),
        avgKillParticipation: avgOrNull(ms.map((m) => m.kill_participation)),
        avgVisionScorePerMinute: avgOrNull(
          ms.map((m) => (m.vision_score ? m.vision_score / (m.duration_seconds / 60) : null)),
        ),
        avgSoloKills: avgOrNull(ms.map((m) => m.timeline?.solo_kills ?? null)),
        avgDeathsBefore10: avgOrNull(ms.map((m) => m.timeline?.deaths_before_10 ?? null)),
        avgDeaths15To25: avgOrNull(ms.map((m) => m.timeline?.deaths_15_to_25 ?? null)),
        firstBloodRate: round(rnd() * 0.25, 2),
      } satisfies ChampionStats;
    })
    .sort((a, b) => b.games - a.games);
}

export function buildSessions(matches: MockMatch[]): SessionSummary[] {
  const ordered = [...matches].sort(
    (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime(),
  );
  const sessions: MockMatch[][] = [];
  let current: MockMatch[] = [];

  for (const m of ordered) {
    if (!current.length) {
      current.push(m);
      continue;
    }
    const last = current[current.length - 1]!;
    const gapMinutes =
      (new Date(m.played_at).getTime() -
        (new Date(last.played_at).getTime() + last.duration_seconds * 1000)) /
      60000;
    if (gapMinutes > 90) {
      sessions.push(current);
      current = [m];
    } else {
      current.push(m);
    }
  }
  if (current.length) sessions.push(current);

  return sessions
    .map((ms, index) => {
      const wins = ms.filter((m) => m.win).length;
      const start = new Date(ms[0]!.played_at);
      const lastMatch = ms[ms.length - 1]!;
      const end = new Date(
        new Date(lastMatch.played_at).getTime() + lastMatch.duration_seconds * 1000,
      );
      const kills = avg(ms.map((m) => m.kills));
      const deaths = avg(ms.map((m) => m.deaths));
      const assists = avg(ms.map((m) => m.assists));
      return {
        id: `session-${index}`,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
        games: ms.length,
        wins,
        losses: ms.length - wins,
        winRate: round((wins / ms.length) * 100, 1),
        champions: [...new Set(ms.map((m) => m.champion_name))],
        roles: [...new Set(ms.map((m) => m.role))],
        avgKda: round((kills + assists) / Math.max(1, deaths), 2),
        avgDeaths: deaths,
        avgCsPerMinute: avg(ms.map((m) => m.cs_per_minute)),
      } satisfies SessionSummary;
    })
    .reverse();
}

export function buildInsights(matches: MockMatch[]): Insight[] {
  const summary = summarize(matches);
  const midGameDeaths = avgOrNull(matches.map((m) => m.timeline?.deaths_15_to_25 ?? null));
  const csDiff10 = avgOrNull(matches.map((m) => m.timeline?.cs_diff_at_10 ?? null));

  return [
    {
      id: "insight-mid-deaths",
      type: "warning",
      category: "Mid game",
      title: "Reduce mid-game deaths",
      message: `You average ${midGameDeaths ?? "—"} deaths between minute 15 and 25, above your own early-game standard.`,
      evidence: `Last ${matches.length} games`,
      sampleSize: matches.length,
      confidence: matches.length >= 40 ? "high" : "medium",
      currentValue: midGameDeaths,
      targetValue: 1.5,
      unit: "deaths",
    },
    {
      id: "insight-laning",
      type: "suggestion",
      category: "Laning",
      title: "Laning CS is close to even",
      message: `Your CS difference at 10 minutes is ${csDiff10 ?? "—"}. Small, consistent gains here compound into mid game.`,
      evidence: `Last ${matches.length} games with timeline data`,
      sampleSize: matches.length,
      confidence: "medium",
      currentValue: csDiff10,
      targetValue: 8,
      unit: "cs",
    },
    {
      id: "insight-farm",
      type: "positive",
      category: "Farm",
      title: "Farm is trending up",
      message: `You are averaging ${summary.avgCsPerMinute} CS per minute across your recent games.`,
      evidence: `Last ${matches.length} games`,
      sampleSize: matches.length,
      confidence: "high",
      currentValue: summary.avgCsPerMinute,
      targetValue: 7.5,
      unit: "cs/min",
    },
    {
      id: "insight-kp",
      type: "positive",
      category: "Teamfighting",
      title: "Strong kill participation",
      message: `You are involved in ${Math.round((summary.avgKillParticipation ?? 0) * 100)}% of your team's kills.`,
      evidence: `Last ${matches.length} games`,
      sampleSize: matches.length,
      confidence: "high",
      currentValue: summary.avgKillParticipation,
      targetValue: 0.6,
      unit: "%",
    },
    {
      id: "insight-pool",
      type: "suggestion",
      category: "Champion pool",
      title: "Champion pool is wide for climbing",
      message:
        "You played more than five champions in this window. Narrowing your pool usually stabilises results.",
      evidence: `Last ${matches.length} games`,
      sampleSize: matches.length,
      confidence: "low",
      currentValue: new Set(matches.map((m) => m.champion_name)).size,
      targetValue: 3,
      unit: "champions",
    },
  ];
}

export const mockGoals: GoalRow[] = [
  {
    id: "goal-1",
    metric: "avgDeaths",
    target: 6,
    comparison: "lte",
    role: "MIDDLE",
    champion: null,
    periodGames: 20,
    active: true,
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "goal-2",
    metric: "csPerMinute",
    target: 7.5,
    comparison: "gte",
    role: "MIDDLE",
    champion: null,
    periodGames: 20,
    active: true,
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "goal-3",
    metric: "winRate",
    target: 52,
    comparison: "gte",
    role: null,
    champion: null,
    periodGames: 50,
    active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "goal-4",
    metric: "championPool",
    target: 3,
    comparison: "lte",
    role: "MIDDLE",
    champion: null,
    periodGames: 50,
    active: true,
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  },
];
