import { useMemo } from "react";

import { QueryBoundary } from "@/components/common/states";
import {
  ChampionTable,
  CoachMark,
  CompareItem,
  FocusEmpty,
  GoalCard,
  InsightCard,
  MatchTable,
  MetricCard,
  PageTitle,
  RankChart,
  SectionLink,
  Surface,
  SummaryFacts,
} from "@/components/lol-ui";
import {
  useChampions,
  useGoalsProgress,
  useInsights,
  useMatches,
  useProgress,
  useRankHistory,
} from "@/hooks/use-lol-data";
import { nf } from "@/lib/format";
import type { Insight } from "@/types/api";

export function OverviewPage() {
  const progress = useProgress({ games: 20 });
  const rankHistory = useRankHistory(90);
  const matches = useMatches({ limit: 20 });
  const champions = useChampions({ games: 50, role: "MIDDLE" });
  const insights = useInsights({ games: 50 });
  const goals = useGoalsProgress();

  const focusItems = useMemo(
    () =>
      selectFocus(
        insights.data?.insights ?? [
          ...(progress.data?.weaknesses ?? []),
          ...(progress.data?.strengths ?? []),
        ],
      ),
    [insights.data?.insights, progress.data?.strengths, progress.data?.weaknesses],
  );

  return (
    <div className="space-y-6">
      <PageTitle title="Overview" kicker="Personal performance coach">
        <div className="text-right text-sm text-muted-foreground">Last 20 ranked games</div>
      </PageTitle>

      <QueryBoundary
        isLoading={progress.isLoading}
        error={progress.error}
        onRetry={() => progress.refetch()}
        loadingRows={6}
      >
        {progress.data ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Recent win rate"
                value={progress.data.comparison.current.winRate}
                previous={progress.data.comparison.previous?.winRate}
                delta={progress.data.comparison.delta?.winRate}
                suffix="%"
              />
              <MetricCard
                label="KDA"
                value={progress.data.comparison.current.kda}
                previous={progress.data.comparison.previous?.kda}
                delta={progress.data.comparison.delta?.kda}
                digits={2}
              />
              <MetricCard
                label="Deaths/game"
                value={progress.data.comparison.current.avgDeaths}
                previous={progress.data.comparison.previous?.avgDeaths}
                delta={progress.data.comparison.delta?.avgDeaths}
                lowerIsBetter
              />
              <MetricCard
                label="CS/min"
                value={progress.data.comparison.current.avgCsPerMinute}
                previous={progress.data.comparison.previous?.avgCsPerMinute}
                delta={progress.data.comparison.delta?.avgCsPerMinute}
                digits={2}
              />
              <MetricCard
                label="Rank movement"
                value={rankMovement(rankHistory.data?.history ?? [])}
                delta={rankMovement(rankHistory.data?.history ?? [])}
                suffix=" LP"
                digits={0}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Surface
                title="Current Focus"
                description="Primary priority, secondary priority, and one strength from backend insights."
              >
                {focusItems.length ? (
                  <div className="grid gap-3">
                    {focusItems.map((item) => (
                      <InsightCard key={item.id} insight={item} />
                    ))}
                  </div>
                ) : (
                  <FocusEmpty />
                )}
              </Surface>

              <Surface
                title="What changed?"
                description="Current period versus the previous matching window."
              >
                <div className="grid gap-3">
                  <CompareItem
                    label="Deaths"
                    current={progress.data.comparison.current.avgDeaths}
                    previous={progress.data.comparison.previous?.avgDeaths}
                    delta={progress.data.comparison.delta?.avgDeaths}
                    digits={2}
                    lowerIsBetter
                  />
                  <CompareItem
                    label="KDA"
                    current={progress.data.comparison.current.kda}
                    previous={progress.data.comparison.previous?.kda}
                    delta={progress.data.comparison.delta?.kda}
                    digits={2}
                  />
                  <CompareItem
                    label="Win rate"
                    current={progress.data.comparison.current.winRate}
                    previous={progress.data.comparison.previous?.winRate}
                    delta={progress.data.comparison.delta?.winRate}
                    suffix="%"
                    deltaSuffix="pp"
                    digits={0}
                  />
                </div>
              </Surface>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <Surface
                title="Recent Form"
                description="Last 20 games summarized without hiding the sample size."
              >
                <SummaryFacts summary={progress.data.comparison.current} />
                <CoachMark>
                  Deaths and farm are the fastest signals to review before queueing again. Current
                  deaths/game is {nf(progress.data.comparison.current.avgDeaths, 1)} and CS/min is{" "}
                  {nf(progress.data.comparison.current.avgCsPerMinute, 2)}.
                </CoachMark>
              </Surface>

              <Surface
                title="Rank Progress"
                description="Ordinal rank scale: division base plus league points."
                actions={<SectionLink to="/progress">Open progress</SectionLink>}
              >
                <QueryBoundary
                  isLoading={rankHistory.isLoading}
                  error={rankHistory.error}
                  onRetry={() => rankHistory.refetch()}
                  isEmpty={!rankHistory.data?.history.length}
                >
                  <RankChart history={rankHistory.data?.history ?? []} />
                </QueryBoundary>
              </Surface>
            </section>
          </>
        ) : null}
      </QueryBoundary>

      <section className="grid gap-4 xl:grid-cols-2">
        <Surface
          title="Champions Preview"
          description="Mid lane sample, strongest samples first."
          actions={<SectionLink to="/champions">Open champions</SectionLink>}
        >
          <QueryBoundary
            isLoading={champions.isLoading}
            error={champions.error}
            onRetry={() => champions.refetch()}
            isEmpty={!champions.data?.champions.length}
          >
            <ChampionTable champions={(champions.data?.champions ?? []).slice(0, 6)} />
          </QueryBoundary>
        </Surface>
        <Surface
          title="Goals Preview"
          description="Active targets from the backend."
          actions={<SectionLink to="/goals">Open goals</SectionLink>}
        >
          <QueryBoundary
            isLoading={goals.isLoading}
            error={goals.error}
            onRetry={() => goals.refetch()}
            isEmpty={!goals.data?.goals.length}
          >
            <div className="grid gap-3">
              {(goals.data?.goals ?? []).slice(0, 3).map((goal) => (
                <GoalCard key={goal.goal.id} item={goal} />
              ))}
            </div>
          </QueryBoundary>
        </Surface>
      </section>

      <Surface
        title="Recent Matches"
        description="Click a match from the Matches page for full detail."
        actions={<SectionLink to="/matches">Open matches</SectionLink>}
      >
        <QueryBoundary
          isLoading={matches.isLoading}
          error={matches.error}
          onRetry={() => matches.refetch()}
          isEmpty={!matches.data?.matches.length}
        >
          <MatchTable matches={matches.data?.matches ?? []} compact />
        </QueryBoundary>
      </Surface>
    </div>
  );
}

function selectFocus(insights: Insight[]): Insight[] {
  const primary = insights.find((i) => i.type === "warning");
  const secondary = insights.find((i) => i.type === "suggestion");
  const strength = insights.find((i) => i.type === "positive");
  return [primary, secondary, strength].filter((item): item is Insight => Boolean(item));
}

function rankMovement(
  history: Array<{ tier: string; division: string; leaguePoints: number }>,
): number | null {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  if (!first || !last) return null;
  const tiers = [
    "IRON",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "EMERALD",
    "DIAMOND",
    "MASTER",
    "GRANDMASTER",
    "CHALLENGER",
  ];
  const divisions = ["IV", "III", "II", "I"];
  const toOrdinal = (item: { tier: string; division: string; leaguePoints: number }) =>
    Math.max(0, tiers.indexOf(item.tier.toUpperCase())) * 400 +
    Math.max(0, divisions.indexOf(item.division.toUpperCase())) * 100 +
    item.leaguePoints;
  return toOrdinal(last) - toOrdinal(first);
}
