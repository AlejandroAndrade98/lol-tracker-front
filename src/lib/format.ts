export function nf(value: number | null | undefined, digits = 1, suffix = ""): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}${suffix}`;
}

export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(digits)}%`;
}

export function signed(value: number | null | undefined, digits = 1, suffix = ""): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}${suffix}`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];
const DIVISIONS = ["IV", "III", "II", "I"];

/** Continuous ordinal rank scale: tier*400 + division*100 + LP. */
export function rankToOrdinal(tier: string, division: string, lp: number): number {
  const t = Math.max(0, TIERS.indexOf(tier.toUpperCase()));
  const d = Math.max(0, DIVISIONS.indexOf(division.toUpperCase()));
  return t * 400 + d * 100 + Math.min(lp, 100);
}

export function ordinalToRankLabel(value: number): string {
  const t = Math.min(TIERS.length - 1, Math.floor(value / 400));
  const rest = value - t * 400;
  const d = Math.min(3, Math.floor(rest / 100));
  const tier = TIERS[t] ?? "IRON";
  const pretty = tier.charAt(0) + tier.slice(1).toLowerCase();
  return `${pretty} ${DIVISIONS[d]}`;
}

export function tierLabel(tier: string, division: string, lp: number): string {
  const pretty = tier.charAt(0) + tier.slice(1).toLowerCase();
  return `${pretty} ${division} · ${lp} LP`;
}

export type ConfidenceLevel = "low" | "medium" | "high";

export function confidenceFromSample(games: number): ConfidenceLevel {
  if (games >= 20) return "high";
  if (games >= 8) return "medium";
  return "low";
}
