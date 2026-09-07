import { useState } from "react";

import { QueryBoundary } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  GoalCard,
  PageTitle,
  Surface,
  comparisonLabel,
  goalMetricLabel,
} from "@/components/lol-ui";
import { useGoalMutations, useGoalsProgress } from "@/hooks/use-lol-data";
import type { GoalComparison, GoalInput, GoalMetric, Role } from "@/types/api";

const METRICS: GoalMetric[] = [
  "avgDeaths",
  "avgCsPerMinute",
  "winRate",
  "kda",
  "championPool",
  "avgKillParticipation",
];
const COMPARISONS: GoalComparison[] = ["lte", "gte", "lt", "gt", "eq"];
const ROLES: Array<Role | "ALL"> = ["ALL", "MIDDLE", "TOP", "BOTTOM", "UTILITY", "JUNGLE"];

const DEFAULT_GOAL: GoalInput = {
  metric: "avgDeaths",
  comparison: "lte",
  target: 6,
  role: "MIDDLE",
  champion: null,
  periodGames: 20,
  active: true,
};

export function GoalsPage() {
  const goals = useGoalsProgress();
  const mutations = useGoalMutations();
  const [input, setInput] = useState<GoalInput>(DEFAULT_GOAL);

  const saving =
    mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;

  return (
    <div className="space-y-6">
      <PageTitle title="Goals" kicker="Active targets" />
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Surface title="Create goal" description="Friendly labels map to backend goal metrics.">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutations.create.mutate(input, { onSuccess: () => setInput(DEFAULT_GOAL) });
            }}
          >
            <label className="grid gap-2 text-sm font-medium">
              Metric
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={input.metric}
                onChange={(event) =>
                  setInput({ ...input, metric: event.target.value as GoalMetric })
                }
              >
                {METRICS.map((metric) => (
                  <option key={metric} value={metric}>
                    {goalMetricLabel(metric)}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Comparison
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={input.comparison}
                  onChange={(event) =>
                    setInput({ ...input, comparison: event.target.value as GoalComparison })
                  }
                >
                  {COMPARISONS.map((comparison) => (
                    <option key={comparison} value={comparison}>
                      {comparisonLabel(comparison)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Target
                <input
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  type="number"
                  step="0.1"
                  value={input.target}
                  onChange={(event) => setInput({ ...input, target: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Role
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={input.role ?? "ALL"}
                  onChange={(event) =>
                    setInput({
                      ...input,
                      role: event.target.value === "ALL" ? null : (event.target.value as Role),
                    })
                  }
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role === "ALL" ? "All roles" : role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Period games
                <input
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  type="number"
                  min="5"
                  max="100"
                  value={input.periodGames}
                  onChange={(event) =>
                    setInput({ ...input, periodGames: Number(event.target.value) })
                  }
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Champion optional
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={input.champion ?? ""}
                onChange={(event) =>
                  setInput({ ...input, champion: event.target.value.trim() || null })
                }
                placeholder="Any champion"
              />
            </label>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving" : "Create goal"}
            </Button>
          </form>
        </Surface>
        <Surface title="Active goals" description="Progress comes from GET /api/goals/progress.">
          <QueryBoundary
            isLoading={goals.isLoading}
            error={goals.error}
            onRetry={() => goals.refetch()}
            isEmpty={!goals.data?.goals.length}
          >
            <div className="grid gap-3">
              {(goals.data?.goals ?? [])
                .filter((item) => item.goal.active)
                .map((item) => (
                  <GoalCard
                    key={item.goal.id}
                    item={item}
                    actions={
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() =>
                            mutations.update.mutate({ id: item.goal.id, input: { active: false } })
                          }
                        >
                          Deactivate
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={saving}
                          onClick={() => mutations.remove.mutate(item.goal.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    }
                  />
                ))}
            </div>
          </QueryBoundary>
        </Surface>
      </section>
    </div>
  );
}
