import { QueryBoundary } from "@/components/common/states";
import {
  Fact,
  PageTitle,
  StatusBadge,
  Surface,
  formatRatioPercent,
  roleLabel,
} from "@/components/lol-ui";
import { useRoles } from "@/hooks/use-lol-data";
import { nf, pct } from "@/lib/format";

const ROLE_ORDER = ["MIDDLE", "TOP", "BOTTOM", "UTILITY", "JUNGLE"];

export function RolesPage() {
  const roles = useRoles({ games: 100 });
  const primary = roles.data?.primaryRole ?? "MIDDLE";

  return (
    <div className="space-y-6">
      <PageTitle title="Roles" kicker="Role profile" />
      <Surface
        title="Role breakdown"
        description="Support farm is shown as context, not compared against laners."
      >
        <QueryBoundary
          isLoading={roles.isLoading}
          error={roles.error}
          onRetry={() => roles.refetch()}
        >
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {ROLE_ORDER.map((role) => {
              const data = roles.data?.allRoles[role];
              return (
                <div key={role} className="rounded-md border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{roleLabel(role)}</h3>
                    {primary === role ? <StatusBadge status="strong" /> : null}
                  </div>
                  {data ? (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Fact label="Games" value={data.games} />
                      <Fact label="WR" value={pct(data.winRate)} />
                      <Fact label="KDA" value={nf(data.kda, 2)} />
                      <Fact label="Deaths" value={nf(data.avgDeaths, 1)} />
                      <Fact
                        label={role === "UTILITY" ? "CS/min context" : "CS/min"}
                        value={nf(data.avgCsPerMinute, 2)}
                      />
                      <Fact label="Damage/min" value={nf(data.avgDamagePerMinute, 0)} />
                      <Fact label="Gold/min" value={nf(data.avgGoldPerMinute, 0)} />
                      <Fact label="KP" value={formatRatioPercent(data.avgKillParticipation)} />
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No data</p>
                  )}
                </div>
              );
            })}
          </div>
        </QueryBoundary>
      </Surface>
    </div>
  );
}
