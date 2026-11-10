import { ArrowRight, Check, Minus, Pencil, TrendingDown, TrendingUp } from "lucide-react";

import { roleLabel } from "@/components/lol-ui";
import { Button } from "@/components/ui/button";
import { nf } from "@/lib/format";
import type { CoachGoalProgress } from "@/types/api";
import { MetricIcon } from "./metric-icon";

const statusStyles = {
  achieved: { label: "Achieved", Icon: Check, color: "text-positive" },
  improving: { label: "Improving", Icon: TrendingUp, color: "text-positive" },
  worsening: { label: "Worsening", Icon: TrendingDown, color: "text-negative" },
  stable: { label: "Stable", Icon: Minus, color: "text-muted-foreground" },
};

export function GoalCard({
  goal,
  priority,
  updating,
  onEdit,
}: {
  goal: CoachGoalProgress;
  priority: "Primary" | "Secondary";
  updating: boolean;
  onEdit: () => void;
}) {
  const status = statusStyles[goal.status];
  return (
    <article
      aria-label={priority + " goal: " + goal.label}
      aria-busy={updating}
      className="min-w-0 rounded-md border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MetricIcon metric={goal.metric} />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{priority}</p>
            <h3 className="mt-0.5 text-base font-semibold">{goal.label}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {goal.role ? roleLabel(goal.role) : "All roles"} · last {goal.periodGames} games
              {goal.champion ? " · " + goal.champion : ""}
            </p>
          </div>
        </div>
        <span className={"flex shrink-0 items-center gap-1 text-xs font-medium " + status.color}>
          <status.Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {status.label}
        </span>
      </div>
      <div className={"mt-5 " + (updating ? "opacity-60" : "")}>
        <p className="text-xs text-muted-foreground">Current</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums">{display(goal.current)}</span>
          <span className="text-sm text-muted-foreground">{unitFor(goal.metric)}</span>
        </div>
      </div>
      <GoalProgress goal={goal} />
      <LastMatchImpact goal={goal} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{goal.sampleSize} games counted</p>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit goal
        </Button>
      </div>
    </article>
  );
}

export function GoalProgress({ goal }: { goal: CoachGoalProgress }) {
  const progress = goal.progressPercent;
  const width = progress === null ? 0 : Math.max(0, Math.min(100, progress));
  return (
    <div className="mt-5">
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Baseline</dt>
          <dd className="mt-1 font-medium tabular-nums">{display(goal.baseline)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Remaining</dt>
          <dd className="mt-1 font-medium tabular-nums">{display(goal.distanceToTarget)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-muted-foreground">Target</dt>
          <dd className="mt-1 font-semibold tabular-nums">
            {comparisonText(goal.comparison)} {display(goal.target)}
          </dd>
        </div>
      </dl>
      <div
        className="relative mt-3 h-2 rounded-full bg-muted"
        role={progress === null ? undefined : "progressbar"}
        aria-label="Progress toward goal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress === null ? undefined : width}
      >
        {progress !== null ? (
          <>
            <div className="h-full rounded-full bg-accent" style={{ width: width + "%" }} />
            <span
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
              style={{ left: `clamp(0px, calc(${width}% - 6px), calc(100% - 12px))` }}
            />
          </>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {progress === null ? "No progress data" : nf(progress, 1) + "% toward goal"}
      </p>
    </div>
  );
}

function LastMatchImpact({ goal }: { goal: CoachGoalProgress }) {
  const impact = goal.lastMatchImpact;
  const missing = impact.delta === null;
  const color =
    missing || impact.delta === 0 || impact.improved === null
      ? "text-muted-foreground"
      : impact.improved
        ? "text-positive"
        : "text-negative";
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">Last match</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-base font-medium tabular-nums">
        <span>{display(impact.previousValue)}</span>
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{display(impact.currentValue)}</span>
        <span className={"ml-1 text-sm " + color}>
          {impact.delta === null ? "—" : signed(impact.delta)}
        </span>
      </div>
      <p className={"mt-1 text-xs " + color}>
        {missing
          ? "No comparison yet"
          : impact.delta === 0
            ? "No directional change"
            : impact.improved === null
              ? "No directional data"
              : impact.improved
                ? "Moved toward goal"
                : "Moved away from goal"}
      </p>
    </div>
  );
}

function display(value: number | null) {
  return value === null ? "—" : nf(value, 2);
}
function signed(value: number) {
  return (value > 0 ? "+" : "") + nf(value, 2);
}
function comparisonText(comparison: CoachGoalProgress["comparison"]) {
  return ({ lte: "≤", gte: "≥", lt: "<", gt: ">", eq: "=" } as const)[comparison];
}
function unitFor(metric: string) {
  switch (metric) {
    case "avgDeaths":
      return "deaths / game";
    case "csPerMinute":
    case "avgCsPerMinute":
      return "CS/min";
    case "winRate":
    case "avgKillParticipation":
      return "%";
    case "kda":
      return "KDA";
    case "championPool":
      return "champions";
    case "avgGoldPerMinute":
      return "gold/min";
    case "avgDamagePerMinute":
      return "damage/min";
    default:
      return "";
  }
}
