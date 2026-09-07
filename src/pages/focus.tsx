import { Link } from "@tanstack/react-router";
import { ChevronRight, RefreshCw, Target } from "lucide-react";
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

import { QueryBoundary } from "@/components/common/states";
import { ChampionAvatar, SampleSizeBadge, roleLabel } from "@/components/lol-ui";
import { Button } from "@/components/ui/button";
import { useCoach, useGoalMutations, useMatches, useSync } from "@/hooks/use-lol-data";
import { nf, pct, shortDate } from "@/lib/format";
import type { CoachGoalProgress, GoalInput, GoalMetric } from "@/types/api";

const COACH_PARAMS = { games: 20, role: "MIDDLE" as const, baselineGames: 100 };

export function FocusPage() {
  const coach = useCoach(COACH_PARAMS);
  const matches = useMatches({ limit: 5, role: "MIDDLE" });
  const sync = useSync();
  const mutations = useGoalMutations();
  const [editing, setEditing] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const goals = coach.data?.goals ?? [];
  const primary =
    goals.find((goal) => goal.label === coach.data?.primaryFocus?.title) ?? goals[0] ?? null;
  const secondary = goals.find((goal) => goal.id !== primary?.id) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Next queue priority
          </p>
          <h2 className="mt-1 text-2xl font-semibold md:text-3xl">Focus</h2>
        </div>
        <div className="flex items-center gap-3">
          {sync.data?.syncedAt ? (
            <p className="text-xs text-muted-foreground">
              Updated just now
              {sync.data.newMatchesInserted
                ? " · " +
                  sync.data.newMatchesInserted +
                  " new match" +
                  (sync.data.newMatchesInserted === 1 ? "" : "es")
                : ""}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
          >
            <RefreshCw className={sync.isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            {sync.isPending ? "Updating" : "Update"}
          </Button>
        </div>
      </header>

      <QueryBoundary
        isLoading={coach.isLoading}
        error={coach.error}
        onRetry={() => coach.refetch()}
        loadingRows={5}
      >
        {coach.data && !goals.length ? <EmptyFocus onStart={() => setStarting(true)} /> : null}
        {coach.data && primary ? (
          <>
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.7fr)]">
              <PrimaryGoal
                goal={primary}
                editing={sync.isPending}
                onEdit={() => setEditing(primary.id)}
              />
              <div className="grid gap-4">
                {secondary ? (
                  <SecondaryGoal goal={secondary} onEdit={() => setEditing(secondary.id)} />
                ) : (
                  <AddSecondaryFocus onStart={() => setStarting(true)} />
                )}
                {coach.data.recommendedChampionFocus ? (
                  <ChampionFocus champion={coach.data.recommendedChampionFocus} />
                ) : null}
              </div>
            </section>
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)]">
              <NextGames goals={goals} />
              <Milestone goal={primary} />
            </section>
          </>
        ) : null}
      </QueryBoundary>

      <section className="border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Recent 5</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Only the signals that change the next game.
            </p>
          </div>
          <Link to="/matches" className="text-sm font-medium text-accent hover:text-accent/80">
            Matches <ChevronRight className="inline h-4 w-4" />
          </Link>
        </div>
        <QueryBoundary
          isLoading={matches.isLoading}
          error={matches.error}
          onRetry={() => matches.refetch()}
          isEmpty={!matches.data?.matches.length}
        >
          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-5">
            {(matches.data?.matches ?? []).map((match) => (
              <article key={match.id} className="min-w-0 bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{match.championName}</span>
                  <span
                    className={
                      match.win
                        ? "text-xs font-semibold text-positive"
                        : "text-xs font-semibold text-negative"
                    }
                  >
                    {match.win ? "W" : "L"}
                  </span>
                </div>
                <p className="mt-3 text-sm tabular-nums">
                  {match.kills}/{match.deaths}/{match.assists}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {match.deaths} deaths · {nf(match.csPerMinute, 1)} CS/min
                </p>
              </article>
            ))}
          </div>
        </QueryBoundary>
      </section>

      {starting && coach.data ? (
        <FocusStarter
          recentForm={coach.data.comparison.current}
          excludeMetric={primary?.metric ?? null}
          saving={mutations.create.isPending}
          onClose={() => setStarting(false)}
          onCreate={(input) =>
            mutations.create.mutate(input, { onSuccess: () => setStarting(false) })
          }
        />
      ) : null}

      {editing ? (
        <EditGoal
          goal={goals.find((goal) => goal.id === editing) ?? null}
          saving={mutations.update.isPending}
          onClose={() => setEditing(null)}
          onSave={(goal, target, periodGames) =>
            mutations.update.mutate(
              { id: goal.id, input: { target, periodGames } },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      ) : null}
    </div>
  );
}

function EmptyFocus({ onStart }: { onStart: () => void }) {
  return (
    <section className="border border-dashed border-border bg-surface px-5 py-10 text-center">
      <Target className="mx-auto h-5 w-5 text-accent" />
      <h3 className="mt-4 text-lg font-semibold">No active focus yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Choose one measurable priority before turning the dashboard into a coaching signal.
      </p>
      <Button asChild className="mt-5">
        <Link to="/goals">Set your first goal</Link>
      </Button>
    </section>
  );
}
function AddSecondaryFocus({ onStart }: { onStart: () => void }) {
  return (
    <section className="border border-dashed border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Secondary focus</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Add one complementary signal when you are ready.
      </p>
      <Button className="mt-4" size="sm" variant="outline" onClick={onStart}>
        Add secondary focus
      </Button>
    </section>
  );
}

type StarterMetric = "avgDeaths" | "csPerMinute";

function FocusStarter({
  recentForm,
  excludeMetric,
  saving,
  onClose,
  onCreate,
}: {
  recentForm: { avgDeaths: number; avgCsPerMinute: number };
  excludeMetric: GoalMetric | null;
  saving: boolean;
  onClose: () => void;
  onCreate: (input: GoalInput) => void;
}) {
  const presets = [
    {
      metric: "avgDeaths" as const,
      title: "Reduce deaths",
      current: recentForm.avgDeaths,
      target: 6,
      comparison: "lte" as const,
      unit: "deaths/game",
    },
    {
      metric: "csPerMinute" as const,
      title: "Improve farm",
      current: recentForm.avgCsPerMinute,
      target: 7,
      comparison: "gte" as const,
      unit: "CS/min",
    },
  ].filter((preset) => preset.metric !== excludeMetric);
  const [selected, setSelected] = useState<StarterMetric | null>(null);
  const preset = presets.find((item) => item.metric === selected) ?? null;
  const [target, setTarget] = useState<number | null>(null);
  const [periodGames, setPeriodGames] = useState(20);

  const choose = (next: (typeof presets)[number]) => {
    setSelected(next.metric);
    setTarget(next.target);
    setPeriodGames(20);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-xl border border-border bg-popover p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Choose your focus
            </p>
            <h3 className="mt-2 text-xl font-semibold">Start with one measurable change</h3>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {presets.map((item) => {
            const active = item.metric === selected;
            return (
              <button
                key={item.metric}
                type="button"
                onClick={() => choose(item)}
                className={
                  active
                    ? "border border-accent bg-accent/10 p-4 text-left transition"
                    : "border border-border bg-surface p-4 text-left transition hover:bg-surface-hover"
                }
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Current{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {nf(item.current, 2)} {item.unit}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Suggested target{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {comparisonText(item.comparison)} {nf(item.target, 1)}
                  </span>
                </p>
                <p className="mt-3 text-xs text-muted-foreground">Last 20 Mid games</p>
              </button>
            );
          })}
        </div>

        {preset && target !== null ? (
          <form
            className="mt-5 border-t border-border pt-5"
            onSubmit={(event) => {
              event.preventDefault();
              onCreate({
                metric: preset.metric,
                target,
                comparison: preset.comparison,
                role: "MIDDLE",
                champion: null,
                periodGames,
                active: true,
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Focus</p>
                <p className="mt-1 font-semibold">{preset.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {nf(preset.current, 2)} {preset.unit}
                </p>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Target
                <input
                  className="h-10 border border-input bg-background px-3 tabular-nums"
                  type="number"
                  step="0.1"
                  value={target}
                  onChange={(event) => setTarget(Number(event.target.value))}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Window
                <input
                  className="h-10 border border-input bg-background px-3 tabular-nums"
                  type="number"
                  min="5"
                  max="100"
                  value={periodGames}
                  onChange={(event) => setPeriodGames(Number(event.target.value))}
                />
              </label>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Mid · last {periodGames} games</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Starting" : "Start focus"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            Choose a focus to review and confirm its target.
          </p>
        )}
      </div>
    </div>
  );
}

function PrimaryGoal({
  goal,
  editing,
  onEdit,
}: {
  goal: CoachGoalProgress;
  editing: boolean;
  onEdit: () => void;
}) {
  return (
    <section className="border border-accent/35 bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Primary focus</p>
          <h3 className="mt-2 text-lg font-semibold">{goal.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {scope(goal)} · {goal.sampleSize} games counted
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit goal
        </Button>
      </div>
      <div
        className={
          editing
            ? "mt-7 flex items-end gap-3 opacity-60 transition-all duration-500"
            : "mt-7 flex items-end gap-3 transition-all duration-500"
        }
      >
        <span className="text-5xl font-semibold tabular-nums md:text-6xl">
          {display(goal.current)}
        </span>
        <span className="pb-2 text-sm text-muted-foreground">{unitFor(goal.metric)}</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-4 text-sm">
        <Value label="Target" value={display(goal.target)} />
        <Value label="Baseline" value={display(goal.baseline)} />
        <Value
          label="Need"
          value={goal.distanceToTarget === null ? "—" : display(goal.distanceToTarget)}
        />
      </div>
      <ProgressToward goal={goal} />
      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Rolling average</p>
        <RollingChart goal={goal} />
      </div>
      <LastImpact goal={goal} />
    </section>
  );
}

function SecondaryGoal({ goal, onEdit }: { goal: CoachGoalProgress; onEdit: () => void }) {
  return (
    <section className="border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Secondary goal
          </p>
          <h3 className="mt-2 text-base font-semibold">{goal.label}</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <Value label="Current" value={display(goal.current)} />
        <Value label="Target" value={display(goal.target)} />
        <Value
          label="Need"
          value={goal.distanceToTarget === null ? "—" : display(goal.distanceToTarget)}
        />
      </div>
      <p
        className={
          goal.status === "improving"
            ? "mt-5 text-sm text-positive"
            : "mt-5 text-sm text-muted-foreground"
        }
      >
        {statusLabel(goal.status)}
      </p>
    </section>
  );
}

function ChampionFocus({
  champion,
}: {
  champion: { championName: string; games: number; winRate: number; kda: number; reason: string };
}) {
  return (
    <section className="border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Champion focus</p>
      <div className="mt-4 flex items-center gap-3">
        <ChampionAvatar championName={champion.championName} />
        <div>
          <h3 className="font-semibold">{champion.championName}</h3>
          <SampleSizeBadge games={champion.games} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Value label="Games" value={String(champion.games)} />
        <Value label="WR" value={pct(champion.winRate)} />
        <Value label="KDA" value={nf(champion.kda, 2)} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{champion.reason}</p>
    </section>
  );
}

function NextGames({ goals }: { goals: CoachGoalProgress[] }) {
  return (
    <section className="border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Next 5 games</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {goals.slice(0, 3).map((goal) => (
          <div key={goal.id} className="border-l-2 border-accent pl-3">
            <p className="text-sm font-medium">{goal.label}</p>
            <p className="mt-1 text-sm tabular-nums text-muted-foreground">
              {comparisonText(goal.comparison)} {display(goal.target)}
              {goal.champion ? " · " + goal.champion : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Milestone({ goal }: { goal: CoachGoalProgress }) {
  const lower = goal.comparison === "lte" || goal.comparison === "lt";
  const best = goal.history.reduce<number | null>(
    (value, point) =>
      value === null
        ? point.value
        : lower
          ? Math.min(value, point.value)
          : Math.max(value, point.value),
    null,
  );
  return (
    <section className="border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Personal context</p>
      <p className="mt-4 text-sm text-muted-foreground">Best rolling {goal.periodGames}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {display(best)}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {goal.label.toLowerCase()}
        </span>
      </p>
    </section>
  );
}

function ProgressToward({ goal }: { goal: CoachGoalProgress }) {
  const progress = goal.progressPercent ?? 0;
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Progress toward goal</span>
        <span className="tabular-nums">
          {goal.progressPercent === null ? "No data" : nf(progress, 1) + "%"}
        </span>
      </div>
      <div className="relative mt-2 h-2 bg-muted">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: Math.max(0, Math.min(100, progress)) + "%" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Baseline {display(goal.baseline)}</span>
        <span>Goal {display(goal.target)}</span>
      </div>
    </div>
  );
}
function RollingChart({ goal }: { goal: CoachGoalProgress }) {
  const data = goal.history.map((point) => ({
    date: shortDate(point.gameCreation),
    value: point.value,
    target: goal.target,
  }));
  if (data.length < 2)
    return <p className="py-10 text-sm text-muted-foreground">Not enough history yet.</p>;
  return (
    <div className="mt-3 h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -22, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
            }}
            formatter={(value, name) => [
              nf(Number(value), 2),
              name === "value" ? goal.label : "Target",
            ]}
          />
          <ReferenceLine y={goal.target} stroke="var(--warning)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function LastImpact({ goal }: { goal: CoachGoalProgress }) {
  const impact = goal.lastMatchImpact;
  const improved = impact.improved === true;
  const worsened = impact.improved === false && impact.delta !== 0;
  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Latest match impact
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums">{display(impact.previousValue)}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-lg font-semibold tabular-nums">{display(impact.currentValue)}</span>
        {impact.delta !== null ? (
          <span
            className={
              improved
                ? "text-sm font-medium text-positive"
                : worsened
                  ? "text-sm font-medium text-warning"
                  : "text-sm text-muted-foreground"
            }
          >
            {signed(impact.delta)}
          </span>
        ) : null}
      </div>
      <p
        className={
          improved
            ? "mt-1 text-sm text-positive"
            : worsened
              ? "mt-1 text-sm text-warning"
              : "mt-1 text-sm text-muted-foreground"
        }
      >
        {improved ? "Improved" : worsened ? "Moved away from goal" : "No directional change"}
      </p>
    </div>
  );
}

function EditGoal({
  goal,
  saving,
  onClose,
  onSave,
}: {
  goal: CoachGoalProgress | null;
  saving: boolean;
  onClose: () => void;
  onSave: (goal: CoachGoalProgress, target: number, periodGames: number) => void;
}) {
  const [target, setTarget] = useState(goal?.target ?? 0);
  const [periodGames, setPeriodGames] = useState(goal?.periodGames ?? 20);
  if (!goal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-4 sm:items-center sm:justify-center">
      <form
        className="w-full max-w-md border border-border bg-popover p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(goal, target, periodGames);
        }}
      >
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Edit goal</p>
        <h3 className="mt-2 text-lg font-semibold">{goal.label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{scope(goal)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="grid gap-2 text-sm font-medium">
            Target
            <input
              className="h-10 border border-input bg-background px-3 tabular-nums"
              type="number"
              step="0.1"
              value={target}
              onChange={(event) => setTarget(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Window
            <input
              className="h-10 border border-input bg-background px-3 tabular-nums"
              type="number"
              min="5"
              max="100"
              value={periodGames}
              onChange={(event) => setPeriodGames(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving" : "Save goal"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function display(value: number | null) {
  return value === null ? "—" : nf(value, 2);
}
function signed(value: number) {
  return (value > 0 ? "+" : "") + nf(value, 2);
}
function unitFor(metric: GoalMetric) {
  return metric === "winRate"
    ? "%"
    : metric === "csPerMinute" || metric === "avgCsPerMinute"
      ? "CS/min"
      : "per game";
}
function scope(goal: CoachGoalProgress) {
  return (
    (goal.role ? roleLabel(goal.role) : "All roles") + " · last " + goal.periodGames + " games"
  );
}
function comparisonText(comparison: CoachGoalProgress["comparison"]) {
  return comparison === "lte"
    ? "≤"
    : comparison === "gte"
      ? "≥"
      : comparison === "lt"
        ? "<"
        : comparison === "gt"
          ? ">"
          : "=";
}
function statusLabel(status: CoachGoalProgress["status"]) {
  return status === "improving"
    ? "Improving"
    : status === "worsening"
      ? "Needs attention"
      : status === "achieved"
        ? "On target"
        : "Stable";
}
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}
