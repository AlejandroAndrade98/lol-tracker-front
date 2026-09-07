import { useState } from "react";

import { QueryBoundary } from "@/components/common/states";
import { GamesFilter, InsightCard, PageTitle, RoleFilter, Surface } from "@/components/lol-ui";
import { useInsights } from "@/hooks/use-lol-data";
import type { InsightType, Role } from "@/types/api";

const GROUPS: Array<{ type: InsightType; label: string }> = [
  { type: "positive", label: "Positive" },
  { type: "warning", label: "Warning" },
  { type: "suggestion", label: "Suggestion" },
];

export function InsightsPage() {
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [games, setGames] = useState(50);
  const insights = useInsights({ games, role: role === "ALL" ? null : role });

  return (
    <div className="space-y-6">
      <PageTitle title="Insights" kicker="Coaching evidence">
        <div className="flex flex-wrap justify-end gap-2">
          <RoleFilter value={role} onChange={setRole} />
          <GamesFilter value={games} onChange={setGames} />
        </div>
      </PageTitle>
      <QueryBoundary
        isLoading={insights.isLoading}
        error={insights.error}
        onRetry={() => insights.refetch()}
        isEmpty={!insights.data?.insights.length}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {GROUPS.map((group) => (
            <Surface key={group.type} title={group.label}>
              <div className="grid gap-3">
                {(insights.data?.insights ?? [])
                  .filter((item) => item.type === group.type)
                  .map((item) => (
                    <InsightCard key={item.id} insight={item} />
                  ))}
                {!(insights.data?.insights ?? []).some((item) => item.type === group.type) ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : null}
              </div>
            </Surface>
          ))}
        </div>
      </QueryBoundary>
    </div>
  );
}
