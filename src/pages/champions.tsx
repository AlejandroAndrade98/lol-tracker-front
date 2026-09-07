import { useMemo, useState } from "react";

import { QueryBoundary } from "@/components/common/states";
import { ChampionTable, GamesFilter, PageTitle, RoleFilter, Surface } from "@/components/lol-ui";
import { useChampions } from "@/hooks/use-lol-data";
import type { ChampionStats, Role } from "@/types/api";

type SortKey = "games" | "winRate" | "kda" | "avgDeaths" | "avgCsPerMinute" | "avgDamagePerMinute";

export function ChampionsPage() {
  const [role, setRole] = useState<Role | "ALL">("MIDDLE");
  const [games, setGames] = useState(50);
  const [sort, setSort] = useState<SortKey>("games");
  const champions = useChampions({ games, role: role === "ALL" ? null : role });
  const sorted = useMemo(
    () => sortChampions(champions.data?.champions ?? [], sort),
    [champions.data?.champions, sort],
  );

  return (
    <div className="space-y-6">
      <PageTitle title="Champions" kicker="Pool quality">
        <div className="flex flex-wrap justify-end gap-2">
          <RoleFilter value={role} onChange={setRole} />
          <GamesFilter value={games} onChange={setGames} />
        </div>
      </PageTitle>
      <Surface
        title="Champion table"
        description="Sample labels are context only; they are not statistical certainty."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {SORTS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSort(item.key)}
              className={`rounded-md border px-3 py-1.5 text-sm ${sort === item.key ? "border-accent/60 bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-surface-hover"}`}
            >
              Sort: {item.label}
            </button>
          ))}
        </div>
        <QueryBoundary
          isLoading={champions.isLoading}
          error={champions.error}
          onRetry={() => champions.refetch()}
          isEmpty={!sorted.length}
        >
          <ChampionTable champions={sorted} />
        </QueryBoundary>
      </Surface>
    </div>
  );
}

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "games", label: "Games" },
  { key: "winRate", label: "Win rate" },
  { key: "kda", label: "KDA" },
  { key: "avgDeaths", label: "Deaths" },
  { key: "avgCsPerMinute", label: "CS/min" },
  { key: "avgDamagePerMinute", label: "Damage/min" },
];

function sortChampions(champions: ChampionStats[], sort: SortKey) {
  const direction = sort === "avgDeaths" ? 1 : -1;
  return [...champions].sort((a, b) => (a[sort] - b[sort]) * direction);
}
