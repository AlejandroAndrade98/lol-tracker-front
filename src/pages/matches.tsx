import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { QueryBoundary } from "@/components/common/states";
import {
  ChampionAvatar,
  MatchResult,
  PageTitle,
  RoleFilter,
  Surface,
  kda,
  roleLabel,
} from "@/components/lol-ui";
import { useMatches } from "@/hooks/use-lol-data";
import { duration, nf, shortDate } from "@/lib/format";
import type { Role } from "@/types/api";

export function MatchesPage() {
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const matches = useMatches({ limit: 60, role: role === "ALL" ? null : role });

  return (
    <div className="space-y-6">
      <PageTitle title="Matches" kicker="Game review">
        <RoleFilter value={role} onChange={setRole} />
      </PageTitle>
      <Surface
        title="Recent matches"
        description="Result, champion, role and economy signals for each game."
      >
        <QueryBoundary
          isLoading={matches.isLoading}
          error={matches.error}
          onRetry={() => matches.refetch()}
          isEmpty={!matches.data?.matches.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 pr-3">Result</th>
                  <th className="px-3 py-3">Champion</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">K/D/A</th>
                  <th className="px-3 py-3">KDA</th>
                  <th className="px-3 py-3">CS</th>
                  <th className="px-3 py-3">CS/min</th>
                  <th className="px-3 py-3">Damage/min</th>
                  <th className="px-3 py-3">Gold/min</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {(matches.data?.matches ?? []).map((match) => (
                  <tr
                    key={match.id}
                    className="border-b border-border/60 transition hover:bg-surface-hover/60 last:border-0"
                  >
                    <td className="py-3 pr-3">
                      <Link
                        to="/matches/$matchId"
                        params={{ matchId: match.id }}
                        aria-label={`Open ${match.champion_name} match`}
                      >
                        <MatchResult win={match.win} />
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to="/matches/$matchId"
                        params={{ matchId: match.id }}
                        className="flex items-center gap-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ChampionAvatar championName={match.champion_name} />
                        {match.champion_name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{roleLabel(match.role)}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {match.kills}/{match.deaths}/{match.assists}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{nf(kda(match), 2)}</td>
                    <td className="px-3 py-3 tabular-nums">{match.cs}</td>
                    <td className="px-3 py-3 tabular-nums">{nf(match.cs_per_minute, 2)}</td>
                    <td className="px-3 py-3 tabular-nums">{nf(match.damage_per_minute, 0)}</td>
                    <td className="px-3 py-3 tabular-nums">{nf(match.gold_per_minute, 0)}</td>
                    <td className="px-3 py-3 tabular-nums">{duration(match.duration_seconds)}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {shortDate(match.played_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryBoundary>
      </Surface>
    </div>
  );
}
