import { useMemo, useState } from "react";

import { QueryBoundary } from "@/components/common/states";
import {
  BarPanel,
  CompareItem,
  DaysFilter,
  Fact,
  GamesFilter,
  LinePanel,
  PageTitle,
  RankChart,
  RoleFilter,
  SessionCard,
  StatusBadge,
  Surface,
  formatRatioPercent,
  kda,
} from "@/components/lol-ui";
import {
  useDeaths,
  useFarm,
  useMatches,
  usePhases,
  useProgress,
  useRankHistory,
  useSessions,
} from "@/hooks/use-lol-data";
import { nf, pct, shortDate } from "@/lib/format";
import type { MatchRow, Role } from "@/types/api";

type Metric = "winRate" | "kda" | "deaths" | "cs" | "damage" | "gold";

export function ProgressPage() {
  const [games, setGames] = useState(50);
  const [days, setDays] = useState<7 | 30 | 90 | "all">(90);
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [metric, setMetric] = useState<Metric>("winRate");
  const params = { games, role: role === "ALL" ? null : role, includeSupport: false };
  const progress = useProgress(params);
  const rankHistory = useRankHistory(days);
  const matches = useMatches({ limit: games, role: role === "ALL" ? null : role });
  const phases = usePhases(params);
  const deaths = useDeaths(params);
  const farm = useFarm(params);
  const sessions = useSessions(days === "all" ? 120 : days);
  const trendData = useMemo(
    () => buildTrend(matches.data?.matches ?? [], metric),
    [matches.data?.matches, metric],
  );

  return (
    <div className="space-y-6">
      <PageTitle title="Progress" kicker="Trends and phases">
        <div className="flex flex-wrap justify-end gap-2">
          <RoleFilter value={role} onChange={setRole} />
          <GamesFilter value={games} onChange={setGames} />
          <DaysFilter value={days} onChange={setDays} />
        </div>
      </PageTitle>

      <section className="grid gap-4 xl:grid-cols-2">
        <Surface title="Rank over time" description="Continuous rank scale, not raw LP.">
          <QueryBoundary
            isLoading={rankHistory.isLoading}
            error={rankHistory.error}
            onRetry={() => rankHistory.refetch()}
            isEmpty={!rankHistory.data?.history.length}
          >
            <RankChart history={rankHistory.data?.history ?? []} />
          </QueryBoundary>
        </Surface>
        <Surface
          title="Metric trend"
          description="One selected metric per chart keeps the signal readable."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {METRICS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMetric(item.key)}
                className={`rounded-md border px-3 py-1.5 text-sm ${metric === item.key ? "border-accent/60 bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-surface-hover"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <QueryBoundary
            isLoading={matches.isLoading}
            error={matches.error}
            onRetry={() => matches.refetch()}
            isEmpty={!trendData.length}
          >
            <LinePanel
              data={trendData}
              label={METRICS.find((item) => item.key === metric)?.label ?? "Metric"}
              formatter={(value) =>
                metric === "winRate"
                  ? pct(Number(value), 0)
                  : nf(Number(value), metric === "kda" || metric === "cs" ? 2 : 1)
              }
            />
          </QueryBoundary>
        </Surface>
      </section>

      <Surface title="Current vs previous period">
        <QueryBoundary
          isLoading={progress.isLoading}
          error={progress.error}
          onRetry={() => progress.refetch()}
        >
          {progress.data ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <CompareItem
                label="Win rate"
                current={progress.data.recentForm.winRate}
                previous={progress.data.previousForm?.winRate}
                suffix="%"
              />
              <CompareItem
                label="KDA"
                current={progress.data.recentForm.kda}
                previous={progress.data.previousForm?.kda}
              />
              <CompareItem
                label="Deaths"
                current={progress.data.recentForm.avgDeaths}
                previous={progress.data.previousForm?.avgDeaths}
                lowerIsBetter
              />
              <CompareItem
                label="CS/min"
                current={progress.data.recentForm.avgCsPerMinute}
                previous={progress.data.previousForm?.avgCsPerMinute}
              />
              <CompareItem
                label="Damage/min"
                current={progress.data.recentForm.avgDamagePerMinute}
                previous={progress.data.previousForm?.avgDamagePerMinute}
              />
              <CompareItem
                label="Gold/min"
                current={progress.data.recentForm.avgGoldPerMinute}
                previous={progress.data.previousForm?.avgGoldPerMinute}
              />
            </div>
          ) : null}
        </QueryBoundary>
      </Surface>

      <Surface
        title="Performance phases"
        description="Status appears only when the backend provides enough evidence."
      >
        <QueryBoundary
          isLoading={phases.isLoading}
          error={phases.error}
          onRetry={() => phases.refetch()}
        >
          {phases.data ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {Object.entries(phases.data.phases).map(([name, block]) => (
                <div key={name} className="rounded-md border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold capitalize">{phaseLabel(name)}</h3>
                    <StatusBadge status={block.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{block.games} games</p>
                  <div className="mt-4 grid gap-3">
                    {block.metrics
                      .filter((m) => m.value !== null)
                      .map((m) => (
                        <Fact
                          key={m.key}
                          label={m.label}
                          value={
                            m.unit === "%"
                              ? formatRatioPercent(m.value)
                              : `${nf(m.value, m.unit === "g" || m.unit === "xp" ? 0 : 1)}${m.unit && m.unit !== "%" ? ` ${m.unit}` : ""}`
                          }
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </QueryBoundary>
      </Surface>

      <section className="grid gap-4 xl:grid-cols-2">
        <Surface title="Death analytics" description="Observed correlation, not causality.">
          <QueryBoundary
            isLoading={deaths.isLoading}
            error={deaths.error}
            onRetry={() => deaths.refetch()}
          >
            {deaths.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <Fact label="Deaths/game" value={nf(deaths.data.avgDeaths, 1)} />
                  <Fact label="Before 10" value={nf(deaths.data.avgDeathsBefore10, 1)} />
                  <Fact label="15-25" value={nf(deaths.data.avgDeaths15To25, 1)} />
                  <Fact label="After 25" value={nf(deaths.data.avgDeathsAfter25, 1)} />
                  <Fact
                    label="First death"
                    value={
                      deaths.data.firstDeathAvgMinute === null
                        ? "No data"
                        : `${nf(deaths.data.firstDeathAvgMinute, 1)} min`
                    }
                  />
                </div>
                <BarPanel
                  data={[
                    { label: "<=5", value: deaths.data.gamesByDeathBucket.lte5 },
                    { label: "6-8", value: deaths.data.gamesByDeathBucket.sixToEight },
                    { label: ">=9", value: deaths.data.gamesByDeathBucket.gte9 },
                  ]}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Fact label="WR <=5" value={pct(deaths.data.winRateWhenDeathsLTE5)} />
                  <Fact label="WR 6-8" value={pct(deaths.data.winRateWhenDeaths6To8)} />
                  <Fact label="WR >=9" value={pct(deaths.data.winRateWhenDeathsGTE9)} />
                </div>
              </div>
            ) : null}
          </QueryBoundary>
        </Surface>

        <Surface title="Farm" description="Support excluded by default in the global filter.">
          <QueryBoundary
            isLoading={farm.isLoading}
            error={farm.error}
            onRetry={() => farm.refetch()}
          >
            {farm.data ? (
              <div className="grid gap-3">
                {Object.entries(farm.data.byRole)
                  .filter(([name]) => name !== "UTILITY")
                  .map(([name, data]) => (
                    <div key={name} className="rounded-md border border-border bg-surface p-4">
                      <div className="flex justify-between gap-3">
                        <h3 className="font-semibold">{name}</h3>
                        <span className="text-xs text-muted-foreground">{data.games} games</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Fact label="CS/min" value={nf(data.avgCsPerMinute, 2)} />
                        <Fact label="CS @10" value={nf(data.avgCsAt10, 1)} />
                        <Fact label="CS @15" value={nf(data.avgCsAt15, 1)} />
                        <Fact label="CS diff @10" value={nf(data.avgCsDiffAt10, 1)} />
                        <Fact label="WR >=8" value={pct(data.winRateWhenCsPerMinuteGTE8)} />
                        <Fact label="WR 7-8" value={pct(data.winRateWhenCsPerMinute7To8)} />
                        <Fact label="WR <7" value={pct(data.winRateWhenCsPerMinuteLT7)} />
                      </div>
                    </div>
                  ))}
              </div>
            ) : null}
          </QueryBoundary>
        </Surface>
      </section>

      <Surface
        title="Sessions"
        description="Grouped by backend sessions so long-session dips are visible without causal claims."
      >
        <QueryBoundary
          isLoading={sessions.isLoading}
          error={sessions.error}
          onRetry={() => sessions.refetch()}
          isEmpty={!sessions.data?.sessions.length}
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {(sessions.data?.sessions ?? []).slice(0, 8).map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </QueryBoundary>
      </Surface>
    </div>
  );
}

const METRICS: Array<{ key: Metric; label: string }> = [
  { key: "winRate", label: "Win rate" },
  { key: "kda", label: "KDA" },
  { key: "deaths", label: "Deaths" },
  { key: "cs", label: "CS/min" },
  { key: "damage", label: "Damage/min" },
  { key: "gold", label: "Gold/min" },
];

function buildTrend(matches: MatchRow[], metric: Metric) {
  const chronological = [...matches].reverse();
  const chunks: MatchRow[][] = [];
  for (let i = 0; i < chronological.length; i += 5) chunks.push(chronological.slice(i, i + 5));
  return chunks
    .filter((chunk) => chunk.length)
    .map((chunk) => ({
      date: shortDate(chunk[chunk.length - 1]!.playedAt),
      value: metricValue(chunk, metric),
    }));
}

function metricValue(matches: MatchRow[], metric: Metric) {
  const avg = (items: number[]) => items.reduce((a, b) => a + b, 0) / Math.max(1, items.length);
  if (metric === "winRate") return (matches.filter((m) => m.win).length / matches.length) * 100;
  if (metric === "kda") return avg(matches.map(kda));
  if (metric === "deaths") return avg(matches.map((m) => m.deaths));
  if (metric === "cs") return avg(matches.map((m) => m.csPerMinute));
  if (metric === "damage") return avg(matches.map((m) => m.damagePerMinute));
  return avg(matches.map((m) => m.goldPerMinute));
}

function phaseLabel(name: string) {
  if (name === "midGame") return "Mid game";
  if (name === "lateGame") return "Late game";
  return "Laning";
}
