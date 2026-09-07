import { Link } from "@tanstack/react-router";

import { QueryBoundary } from "@/components/common/states";
import {
  ChampionAvatar,
  Fact,
  MatchResult,
  PageTitle,
  Surface,
  kda,
  roleLabel,
} from "@/components/lol-ui";
import { useMatch } from "@/hooks/use-lol-data";
import { duration, nf, shortDate } from "@/lib/format";
import type { MatchTimelineMetricRow } from "@/types/api";

export function MatchDetailPage({ matchId }: { matchId: string }) {
  const match = useMatch(matchId);
  const detail = match.data;
  const timeline = detail?.timelineMetrics ?? null;

  return (
    <div className="space-y-6">
      <PageTitle title="Match Detail" kicker="Player vs opponent">
        <Link
          to="/matches"
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to matches
        </Link>
      </PageTitle>
      <QueryBoundary
        isLoading={match.isLoading}
        error={match.error}
        onRetry={() => match.refetch()}
      >
        {detail ? (
          <>
            <Surface>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ChampionAvatar championName={detail.summary.championName} />
                  <div>
                    <h2 className="text-xl font-semibold">{detail.summary.championName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {roleLabel(detail.summary.role)} · {shortDate(detail.summary.playedAt)} ·{" "}
                      {duration(detail.summary.durationSeconds)}
                    </p>
                  </div>
                </div>
                <MatchResult win={detail.summary.win} />
              </div>
            </Surface>

            <section className="grid gap-4 lg:grid-cols-2">
              <Surface title="Player performance">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Fact
                    label="K/D/A"
                    value={`${detail.playerStats.kills}/${detail.playerStats.deaths}/${detail.playerStats.assists}`}
                  />
                  <Fact label="KDA" value={nf(kda(detail.playerStats), 2)} />
                  <Fact label="CS/min" value={nf(detail.playerStats.csPerMinute, 2)} />
                  <Fact label="Vision" value={nf(detail.playerStats.visionScore, 0)} />
                  <Fact label="Damage" value={nf(detail.playerStats.damage, 0)} />
                  <Fact label="Gold" value={nf(detail.playerStats.gold, 0)} />
                  <Fact label="Damage/min" value={nf(detail.playerStats.damagePerMinute, 0)} />
                  <Fact label="Gold/min" value={nf(detail.playerStats.goldPerMinute, 0)} />
                </div>
              </Surface>
              {hasOpponent(detail.opponentStats) ? (
                <Surface title="Opponent comparison">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Fact label="Opponent" value={detail.opponentStats.championName ?? "No data"} />
                    <Fact
                      label="K/D/A"
                      value={`${nf(detail.opponentStats.kills, 0)}/${nf(detail.opponentStats.deaths, 0)}/${nf(detail.opponentStats.assists, 0)}`}
                    />
                    <Fact label="CS/min" value={nf(detail.opponentStats.csPerMinute, 2)} />
                    <Fact label="Damage" value={nf(detail.opponentStats.damage, 0)} />
                    <Fact label="Gold" value={nf(detail.opponentStats.gold, 0)} />
                    <Fact label="CS" value={nf(detail.opponentStats.cs, 0)} />
                  </div>
                </Surface>
              ) : null}
            </section>

            {timeline && hasTimelineAt10(timeline) ? (
              <TimelineSurface title="At 10" timeline={timeline} minute="10" />
            ) : null}
            {timeline && hasTimelineAt15(timeline) ? (
              <TimelineSurface title="At 15" timeline={timeline} minute="15" />
            ) : null}
            {timeline && hasDeaths(timeline) ? (
              <Surface title="Deaths">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <Fact label="Before 10" value={nf(timeline.deathsBefore10, 1)} />
                  <Fact label="Before 15" value={nf(timeline.deathsBefore15, 1)} />
                  <Fact label="15-25" value={nf(timeline.deaths15To25, 1)} />
                  <Fact label="After 25" value={nf(timeline.deathsAfter25, 1)} />
                  <Fact
                    label="First death"
                    value={
                      timeline.firstDeathMinute === null
                        ? "No data"
                        : `${timeline.firstDeathMinute} min`
                    }
                  />
                </div>
              </Surface>
            ) : null}
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}

function TimelineSurface({
  title,
  timeline,
  minute,
}: {
  title: string;
  timeline: MatchTimelineMetricRow;
  minute: "10" | "15";
}) {
  const is10 = minute === "10";
  return (
    <Surface title={title}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-7">
        <Fact label="CS" value={nf(is10 ? timeline.csAt10 : timeline.csAt15, 0)} />
        <Fact label="Gold" value={nf(is10 ? timeline.goldAt10 : timeline.goldAt15, 0)} />
        <Fact label="XP" value={nf(is10 ? timeline.xpAt10 : timeline.xpAt15, 0)} />
        <Fact label="Level" value={nf(is10 ? timeline.levelAt10 : timeline.levelAt15, 0)} />
        <Fact label="CS diff" value={nf(is10 ? timeline.csDiffAt10 : timeline.csDiffAt15, 0)} />
        <Fact
          label="Gold diff"
          value={nf(is10 ? timeline.goldDiffAt10 : timeline.goldDiffAt15, 0)}
        />
        <Fact label="XP diff" value={nf(is10 ? timeline.xpDiffAt10 : timeline.xpDiffAt15, 0)} />
      </div>
    </Surface>
  );
}

function hasOpponent(value: {
  championName: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  cs: number | null;
  csPerMinute: number | null;
  gold: number | null;
  damage: number | null;
}) {
  return Object.values(value).some((item) => item !== null);
}

function hasTimelineAt10(timeline: MatchTimelineMetricRow) {
  return [
    timeline.csAt10,
    timeline.goldAt10,
    timeline.xpAt10,
    timeline.levelAt10,
    timeline.csDiffAt10,
    timeline.goldDiffAt10,
    timeline.xpDiffAt10,
  ].some((item) => item !== null);
}

function hasTimelineAt15(timeline: MatchTimelineMetricRow) {
  return [
    timeline.csAt15,
    timeline.goldAt15,
    timeline.xpAt15,
    timeline.levelAt15,
    timeline.csDiffAt15,
    timeline.goldDiffAt15,
    timeline.xpDiffAt15,
  ].some((item) => item !== null);
}

function hasDeaths(timeline: MatchTimelineMetricRow) {
  return [
    timeline.deathsBefore10,
    timeline.deathsBefore15,
    timeline.deaths15To25,
    timeline.deathsAfter25,
    timeline.firstDeathMinute,
  ].some((item) => item !== null);
}
