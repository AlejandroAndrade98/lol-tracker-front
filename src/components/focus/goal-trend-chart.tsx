import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { nf, shortDate } from "@/lib/format";
import type { CoachGoalProgress } from "@/types/api";
import { roleLabel } from "@/components/lol-ui";

export function GoalTrendChart({ goals }: { goals: CoachGoalProgress[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const goal = goals.find((item) => item.id === selectedId) ?? goals[0];
  if (!goal) return null;
  return (
    <section aria-labelledby="goal-trend-heading" className="min-w-0 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="goal-trend-heading" className="text-base font-semibold">
          Goal trend
        </h2>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Goal trend metric">
          {goals.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === goal.id}
              onClick={() => setSelectedId(item.id)}
              className={
                "min-h-8 rounded px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent " +
                (item.id === goal.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover")
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          {goal.role ? roleLabel(goal.role) : "All roles"} · rolling {goal.periodGames} games
        </p>
        <span className="flex items-center gap-2">
          <span className="w-4 border-t border-dashed border-warning" />
          Target {nf(goal.target, 2)}
        </span>
      </div>
      <div
        className="mt-2 h-44 w-full min-w-0"
        role="img"
        aria-label={`${goal.label}, rolling ${goal.periodGames} games, target ${nf(goal.target, 2)}`}
      >
        {goal.history.length < 2 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Not enough history yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={goal.history} margin={{ left: -16, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="gameCreation"
                tickFormatter={shortDate}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={[
                  (min: number) => Math.min(min, goal.target),
                  (max: number) => Math.max(max, goal.target),
                ]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                labelFormatter={(value) => shortDate(String(value))}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                }}
                formatter={(value) => [nf(Number(value), 2), goal.label]}
              />
              <ReferenceLine y={goal.target} stroke="var(--warning)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
