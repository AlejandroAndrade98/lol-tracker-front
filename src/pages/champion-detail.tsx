import { Link } from "@tanstack/react-router";

import { QueryBoundary } from "@/components/common/states";
import {
  ChampionAvatar,
  Fact,
  MatchTable,
  PageTitle,
  SampleSizeBadge,
  Surface,
  formatRatioPercent,
} from "@/components/lol-ui";
import { useChampion } from "@/hooks/use-lol-data";
import { nf, pct } from "@/lib/format";

export function ChampionDetailPage({ championName }: { championName: string }) {
  const champion = useChampion(championName, { games: 100 });
  const data = champion.data?.champion;

  return (
    <div className="space-y-6">
      <PageTitle title={championName} kicker="Champion detail">
        <Link
          to="/champions"
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to champions
        </Link>
      </PageTitle>
      <QueryBoundary
        isLoading={champion.isLoading}
        error={champion.error}
        onRetry={() => champion.refetch()}
      >
        {data ? (
          <>
            <Surface>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ChampionAvatar championName={data.championName} />
                  <div>
                    <h2 className="text-xl font-semibold">{data.championName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {data.role} · clear sample before strong conclusions
                    </p>
                  </div>
                </div>
                <SampleSizeBadge games={data.games} />
              </div>
            </Surface>
            <Surface title="Performance profile">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                <Fact label="Games" value={data.games} />
                <Fact label="WR" value={pct(data.winRate)} />
                <Fact label="KDA" value={nf(data.kda, 2)} />
                <Fact label="Deaths" value={nf(data.avgDeaths, 1)} />
                <Fact label="CS/min" value={nf(data.avgCsPerMinute, 2)} />
                <Fact label="CS @10" value={nf(data.avgCsAt10, 1)} />
                <Fact label="CS @15" value={nf(data.avgCsAt15, 1)} />
                <Fact label="CS diff @10" value={nf(data.avgCsDiffAt10, 1)} />
                <Fact label="Gold diff @10" value={nf(data.avgGoldDiffAt10, 0)} />
                <Fact label="Damage/min" value={nf(data.avgDamagePerMinute, 0)} />
                <Fact label="KP" value={formatRatioPercent(data.avgKillParticipation)} />
                <Fact label="Solo kills" value={nf(data.avgSoloKills, 1)} />
                <Fact label="Deaths 15-25" value={nf(data.avgDeaths15To25, 1)} />
              </div>
            </Surface>
            {champion.data?.recentMatches?.length ? (
              <Surface title="Recent games with this champion">
                <MatchTable matches={champion.data.recentMatches} compact />
              </Surface>
            ) : null}
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}
