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
                  <ChampionAvatar championName={detail.summary.champion_name} />
                  <div>
                    <h2 className="text-xl font-semibold">{detail.summary.champion_name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {roleLabel(detail.summary.role)} · {shortDate(detail.summary.played_at)} ·{" "}
                      {duration(detail.summary.duration_seconds)}
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
                  <Fact label="CS/min" value={nf(detail.playerStats.cs_per_minute, 2)} />
                  <Fact label="Vision" value={nf(detail.playerStats.vision_score, 0)} />
                  <Fact label="Damage" value={nf(detail.playerStats.damage, 0)} />
                  <Fact label="Gold" value={nf(detail.playerStats.gold, 0)} />
                  <Fact label="Damage/min" value={nf(detail.playerStats.damage_per_minute, 0)} />
                  <Fact label="Gold/min" value={nf(detail.playerStats.gold_per_minute, 0)} />
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
                  <Fact label="Before 10" value={nf(timeline.deaths_before_10, 1)} />
                  <Fact label="Before 15" value={nf(timeline.deaths_before_15, 1)} />
                  <Fact label="15-25" value={nf(timeline.deaths_15_to_25, 1)} />
                  <Fact label="After 25" value={nf(timeline.deaths_after_25, 1)} />
                  <Fact
                    label="First death"
                    value={
                      timeline.first_death_minute === null
                        ? "No data"
                        : `${timeline.first_death_minute} min`
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
        <Fact label="CS" value={nf(is10 ? timeline.cs_at_10 : timeline.cs_at_15, 0)} />
        <Fact label="Gold" value={nf(is10 ? timeline.gold_at_10 : timeline.gold_at_15, 0)} />
        <Fact label="XP" value={nf(is10 ? timeline.xp_at_10 : timeline.xp_at_15, 0)} />
        <Fact label="Level" value={nf(is10 ? timeline.level_at_10 : timeline.level_at_15, 0)} />
        <Fact
          label="CS diff"
          value={nf(is10 ? timeline.cs_diff_at_10 : timeline.cs_diff_at_15, 0)}
        />
        <Fact
          label="Gold diff"
          value={nf(is10 ? timeline.gold_diff_at_10 : timeline.gold_diff_at_15, 0)}
        />
        <Fact
          label="XP diff"
          value={nf(is10 ? timeline.xp_diff_at_10 : timeline.xp_diff_at_15, 0)}
        />
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
    timeline.cs_at_10,
    timeline.gold_at_10,
    timeline.xp_at_10,
    timeline.level_at_10,
    timeline.cs_diff_at_10,
    timeline.gold_diff_at_10,
    timeline.xp_diff_at_10,
  ].some((item) => item !== null);
}

function hasTimelineAt15(timeline: MatchTimelineMetricRow) {
  return [
    timeline.cs_at_15,
    timeline.gold_at_15,
    timeline.xp_at_15,
    timeline.level_at_15,
    timeline.cs_diff_at_15,
    timeline.gold_diff_at_15,
    timeline.xp_diff_at_15,
  ].some((item) => item !== null);
}

function hasDeaths(timeline: MatchTimelineMetricRow) {
  return [
    timeline.deaths_before_10,
    timeline.deaths_before_15,
    timeline.deaths_15_to_25,
    timeline.deaths_after_25,
    timeline.first_death_minute,
  ].some((item) => item !== null);
}
