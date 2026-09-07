import { Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Swords,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ROLE_LABELS,
  type ChampionStats,
  type GoalComparison,
  type GoalMetric,
  type GoalProgress,
  type Insight,
  type MatchRow,
  type RankedSnapshotRow,
  type Role,
  type SessionSummary,
  type TimeWindowSummary,
} from "@/types/api";
import {
  confidenceFromSample,
  duration,
  nf,
  ordinalToRankLabel,
  pct,
  rankToOrdinal,
  shortDate,
  signed,
  tierLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const ROLE_OPTIONS: Array<{ value: Role | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "MIDDLE", label: "Mid" },
  { value: "TOP", label: "Top" },
  { value: "BOTTOM", label: "ADC" },
  { value: "UTILITY", label: "Support" },
  { value: "JUNGLE", label: "Jungle" },
];

export const GAME_WINDOWS = [20, 50, 100] as const;
export const DAY_WINDOWS: Array<7 | 30 | 90 | "all"> = [7, 30, 90, "all"];

export function PageTitle({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker ? (
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{kicker}</p>
        ) : null}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function Surface({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border bg-card shadow-none", className)}>
      {title || actions ? (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
          <div>
            {title ? (
              <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </CardHeader>
      ) : null}
      <CardContent className={title || actions ? undefined : "pt-6"}>{children}</CardContent>
    </Card>
  );
}

export function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "border-accent/60 bg-accent/10 text-accent",
      )}
    >
      {children}
    </button>
  );
}

export function RoleFilter({
  value,
  onChange,
  includeAll = true,
}: {
  value: Role | "ALL";
  onChange: (value: Role | "ALL") => void;
  includeAll?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Role filter">
      {ROLE_OPTIONS.filter((r) => includeAll || r.value !== "ALL").map((role) => (
        <FilterButton
          key={role.value}
          active={value === role.value}
          onClick={() => onChange(role.value)}
        >
          {role.label}
        </FilterButton>
      ))}
    </div>
  );
}

export function GamesFilter({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Games filter">
      {GAME_WINDOWS.map((games) => (
        <FilterButton key={games} active={value === games} onClick={() => onChange(games)}>
          {games} games
        </FilterButton>
      ))}
    </div>
  );
}

export function DaysFilter({
  value,
  onChange,
}: {
  value: 7 | 30 | 90 | "all";
  onChange: (value: 7 | 30 | 90 | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Days filter">
      {DAY_WINDOWS.map((days) => (
        <FilterButton key={days} active={value === days} onClick={() => onChange(days)}>
          {days === "all" ? "All" : `${days}D`}
        </FilterButton>
      ))}
    </div>
  );
}

export function TrendIndicator({
  delta,
  suffix = "",
  digits = 1,
  lowerIsBetter = false,
}: {
  delta: number | null | undefined;
  suffix?: string;
  digits?: number;
  lowerIsBetter?: boolean;
}) {
  if (delta === null || delta === undefined)
    return <span className="text-xs text-muted-foreground">No comparison</span>;
  const flat = Math.abs(delta) < 0.005;
  const good = lowerIsBetter ? delta < 0 : delta > 0;
  const Icon = flat ? ArrowRight : good ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        flat ? "text-muted-foreground" : good ? "text-positive" : "text-negative",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {signed(delta, digits, suffix)}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  previous,
  suffix = "",
  digits = 1,
  lowerIsBetter = false,
}: {
  label: string;
  value: number | null | undefined;
  delta?: number | null | undefined;
  previous?: number | null | undefined;
  suffix?: string;
  digits?: number;
  lowerIsBetter?: boolean;
}) {
  return (
    <Surface className="min-h-[126px]">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold tabular-nums">{nf(value, digits, suffix)}</span>
        <TrendIndicator
          delta={delta}
          suffix={suffix}
          digits={digits}
          lowerIsBetter={lowerIsBetter}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Previous: {nf(previous, digits, suffix)}</p>
    </Surface>
  );
}

export function StatusBadge({
  status,
}: {
  status: "strong" | "neutral" | "needs_attention" | "insufficient_data";
}) {
  const label =
    status === "needs_attention"
      ? "Needs attention"
      : status === "insufficient_data"
        ? "Not enough data"
        : status === "strong"
          ? "Strong"
          : "Neutral";
  const Icon =
    status === "strong" ? CircleCheck : status === "needs_attention" ? CircleAlert : CircleDashed;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        status === "strong" && "border-positive/30 bg-positive/10 text-positive",
        status === "needs_attention" && "border-warning/30 bg-warning/10 text-warning",
        status === "neutral" && "border-border text-muted-foreground",
        status === "insufficient_data" && "border-border text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function SampleSizeBadge({ games }: { games: number | null | undefined }) {
  const count = games ?? 0;
  const confidence = confidenceFromSample(count);
  const label =
    count >= 20
      ? "Stronger sample"
      : count >= 10
        ? "Moderate sample"
        : count >= 5
          ? "Low sample"
          : "Very low sample";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        confidence === "high" && "border-positive/30 bg-positive/10 text-positive",
        confidence === "medium" && "border-warning/30 bg-warning/10 text-warning",
        confidence === "low" && "border-border text-muted-foreground",
      )}
    >
      {label} · {count} games
    </Badge>
  );
}

export function ChampionAvatar({ championName }: { championName: string }) {
  const initials = championName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-xs font-semibold text-accent"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function InsightCard({ insight, compact = false }: { insight: Insight; compact?: boolean }) {
  const tone =
    insight.type === "positive" ? "positive" : insight.type === "warning" ? "warning" : "accent";
  return (
    <div
      className={cn(
        "rounded-md border p-4",
        tone === "positive" && "border-positive/25 bg-positive/8",
        tone === "warning" && "border-warning/25 bg-warning/8",
        tone === "accent" && "border-accent/25 bg-accent/8",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {insight.category}
        </p>
        <Badge variant="outline" className="border-border text-xs capitalize text-muted-foreground">
          {insight.confidence} confidence
        </Badge>
      </div>
      <h3 className="mt-3 text-base font-semibold">{insight.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{insight.message}</p>
      {!compact ? (
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <Fact label="Evidence" value={insight.evidence} />
          <Fact
            label="Sample"
            value={insight.sampleSize === null ? "No data" : `${insight.sampleSize} games`}
          />
          <Fact
            label="Target"
            value={
              insight.targetValue === null
                ? "No data"
                : `${insight.targetValue}${insight.unit ?? ""}`
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

export function MatchResult({ win }: { win: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-14 justify-center",
        win
          ? "border-positive/30 bg-positive/10 text-positive"
          : "border-negative/30 bg-negative/10 text-negative",
      )}
    >
      {win ? "Win" : "Loss"}
    </Badge>
  );
}

export function MatchTable({
  matches,
  compact = false,
}: {
  matches: MatchRow[];
  compact?: boolean;
}) {
  if (!matches.length)
    return <div className="py-8 text-center text-sm text-muted-foreground">No match data</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
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
          {matches.map((match) => {
            const kda = (match.kills + match.assists) / Math.max(1, match.deaths);
            const cells = (
              <>
                <td className="py-3 pr-3">
                  <MatchResult win={match.win} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <ChampionAvatar championName={match.championName} />
                    <span className="font-medium">{match.championName}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{roleLabel(match.role)}</td>
                <td className="px-3 py-3 tabular-nums">
                  {match.kills}/{match.deaths}/{match.assists}
                </td>
                <td className="px-3 py-3 tabular-nums">{nf(kda, 2)}</td>
                <td className="px-3 py-3 tabular-nums">{match.cs}</td>
                <td className="px-3 py-3 tabular-nums">{nf(match.csPerMinute, 2)}</td>
                <td className="px-3 py-3 tabular-nums">{nf(match.damagePerMinute, 0)}</td>
                <td className="px-3 py-3 tabular-nums">{nf(match.goldPerMinute, 0)}</td>
                <td className="px-3 py-3 tabular-nums">{duration(match.durationSeconds)}</td>
                <td className="px-3 py-3 text-muted-foreground">{shortDate(match.playedAt)}</td>
              </>
            );
            return compact ? (
              <tr key={match.id} className="border-b border-border/60 last:border-0">
                {cells}
              </tr>
            ) : (
              <tr
                key={match.id}
                className="border-b border-border/60 transition hover:bg-surface-hover/60 last:border-0"
              >
                <LinkRow to="/matches/$matchId" params={{ matchId: match.id }}>
                  {cells}
                </LinkRow>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LinkRow({
  to,
  params,
  children,
}: {
  to: "/matches/$matchId";
  params: { matchId: string };
  children: ReactNode;
}) {
  return <>{Array.isArray(children) ? children : children}</>;
}

export function ChampionTable({ champions }: { champions: ChampionStats[] }) {
  if (!champions.length)
    return <div className="py-8 text-center text-sm text-muted-foreground">No champion data</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-3 pr-3">Champion</th>
            <th className="px-3 py-3">Role</th>
            <th className="px-3 py-3">Games</th>
            <th className="px-3 py-3">WR</th>
            <th className="px-3 py-3">KDA</th>
            <th className="px-3 py-3">Deaths</th>
            <th className="px-3 py-3">CS/min</th>
            <th className="px-3 py-3">CS diff @10</th>
            <th className="px-3 py-3">Gold diff @10</th>
            <th className="px-3 py-3">Damage/min</th>
            <th className="px-3 py-3">KP</th>
            <th className="px-3 py-3">Sample</th>
          </tr>
        </thead>
        <tbody>
          {champions.map((champion) => (
            <tr
              key={`${champion.championName}-${champion.role}`}
              className="border-b border-border/60 transition hover:bg-surface-hover/60 last:border-0"
            >
              <td className="py-3 pr-3">
                <Link
                  to="/champions/$championName"
                  params={{ championName: champion.championName }}
                  className="flex items-center gap-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChampionAvatar championName={champion.championName} />
                  {champion.championName}
                </Link>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{roleLabel(champion.role)}</td>
              <td className="px-3 py-3 tabular-nums">{champion.games}</td>
              <td className="px-3 py-3 tabular-nums">{pct(champion.winRate)}</td>
              <td className="px-3 py-3 tabular-nums">{nf(champion.kda, 2)}</td>
              <td className="px-3 py-3 tabular-nums">{nf(champion.avgDeaths, 1)}</td>
              <td className="px-3 py-3 tabular-nums">{nf(champion.avgCsPerMinute, 2)}</td>
              <td className="px-3 py-3 tabular-nums">{nf(champion.avgCsDiffAt10, 1)}</td>
              <td className="px-3 py-3 tabular-nums">{nf(champion.avgGoldDiffAt10, 0)}</td>
              <td className="px-3 py-3 tabular-nums">{nf(champion.avgDamagePerMinute, 0)}</td>
              <td className="px-3 py-3 tabular-nums">
                {formatRatioPercent(champion.avgKillParticipation)}
              </td>
              <td className="px-3 py-3">
                <SampleSizeBadge games={champion.games} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankChart({ history }: { history: RankedSnapshotRow[] }) {
  const data = history.map((snap) => ({
    date: shortDate(snap.capturedAt),
    value: rankToOrdinal(snap.tier, snap.division, snap.leaguePoints),
    label: tierLabel(snap.tier, snap.division, snap.leaguePoints),
    wl: `${snap.wins}W / ${snap.losses}L`,
  }));
  return (
    <LinePanel
      data={data}
      dataKey="value"
      label="Rank"
      formatter={(value) => ordinalToRankLabel(Number(value))}
    />
  );
}

export type SimplePoint = { label: string; value: number | null };

export function LinePanel({
  data,
  dataKey = "value",
  label,
  formatter,
}: {
  data: Array<Record<string, string | number | null>>;
  dataKey?: string;
  label: string;
  formatter?: (value: string | number | null) => string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (formatter ? formatter(value) : String(value))}
            width={86}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
            }}
            formatter={(value) => [
              formatter ? formatter(value as string | number | null) : value,
              label,
            ]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarPanel({
  data,
  valueKey = "value",
}: {
  data: Array<Record<string, string | number | null>>;
  valueKey?: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey={valueKey} fill="var(--accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GoalCard({ item, actions }: { item: GoalProgress; actions?: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {goalMetricLabel(item.goal.metric)} {comparisonLabel(item.goal.comparison)}{" "}
            {item.goal.target}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.goal.role ? ROLE_LABELS[item.goal.role] : "All roles"} · last{" "}
            {item.goal.periodGames} games · current {nf(item.currentValue, 1)}
          </p>
        </div>
        {actions}
      </div>
      <Progress className="mt-4 h-2" value={item.progressPercent} />
      <p className="mt-2 text-xs text-muted-foreground">
        {item.achieved ? "On target" : "In progress"} · {item.games} games counted
      </p>
    </div>
  );
}

export function SessionCard({ session }: { session: SessionSummary }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {session.games} games · {session.wins}W / {session.losses}L
        </p>
        <Badge variant="outline" className="border-border text-muted-foreground">
          {pct(session.winRate)}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <Fact label="Duration" value={`${session.durationMinutes} min`} />
        <Fact label="KDA" value={nf(session.avgKda, 2)} />
        <Fact label="Deaths" value={nf(session.avgDeaths, 1)} />
        <Fact label="CS/min" value={nf(session.avgCsPerMinute, 2)} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {shortDate(session.startedAt)} to {shortDate(session.endedAt)} ·{" "}
        {session.champions.slice(0, 4).join(", ")} · {session.roles.map(roleLabel).join(", ")}
      </p>
    </div>
  );
}

export function SummaryFacts({ summary }: { summary: TimeWindowSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Fact label="W / L" value={`${summary.wins} / ${summary.losses}`} />
      <Fact label="Win rate" value={pct(summary.winRate)} />
      <Fact label="KDA" value={nf(summary.kda, 2)} />
      <Fact label="CS/min" value={nf(summary.avgCsPerMinute, 2)} />
    </div>
  );
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

export function formatRatioPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "No data";
  return value <= 1 ? pct(value * 100, 0) : pct(value, 0);
}

export function kda(match: MatchRow): number {
  return (match.kills + match.assists) / Math.max(1, match.deaths);
}

export function goalMetricLabel(metric: GoalMetric): string {
  const labels: Record<GoalMetric, string> = {
    avgDeaths: "Deaths/game",
    csPerMinute: "CS/min",
    avgCsPerMinute: "CS/min",
    winRate: "Win rate",
    championPool: "Champion pool",
    avgKillParticipation: "Kill participation",
    kda: "KDA",
  };
  return labels[metric];
}

export function comparisonLabel(comparison: GoalComparison): string {
  const labels: Record<GoalComparison, string> = {
    lte: "<=",
    gte: ">=",
    lt: "<",
    gt: ">",
    eq: "=",
  };
  return labels[comparison];
}

export function FocusEmpty() {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
      No data yet. Connect the API or enable mock mode to see coaching priorities.
    </div>
  );
}

export function SectionLink({
  to,
  children,
}: {
  to: "/matches" | "/champions" | "/progress" | "/goals" | "/insights";
  children: ReactNode;
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={to}>{children}</Link>
    </Button>
  );
}

export function CompareItem({
  label,
  current,
  previous,
  suffix = "",
  lowerIsBetter = false,
}: {
  label: string;
  current: number | null | undefined;
  previous: number | null | undefined;
  suffix?: string;
  lowerIsBetter?: boolean;
}) {
  const delta =
    current !== null && current !== undefined && previous !== null && previous !== undefined
      ? current - previous
      : null;
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <TrendIndicator delta={delta} suffix={suffix} lowerIsBetter={lowerIsBetter} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{nf(current, 1, suffix)}</span>
        <span className="text-xs text-muted-foreground">vs {nf(previous, 1, suffix)}</span>
      </div>
    </div>
  );
}

export function CoachMark({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-accent/25 bg-accent/8 p-4 text-sm text-muted-foreground">
      <Swords className="mb-3 h-4 w-4 text-accent" aria-hidden="true" />
      {children}
    </div>
  );
}
