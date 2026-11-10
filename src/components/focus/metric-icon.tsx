import { Coins, Crosshair, Skull, Swords, Trophy, Users, Zap } from "lucide-react";
import { useState } from "react";

export function MetricIcon({
  metric,
  className = "h-12 w-12",
}: {
  metric: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if ((metric === "csPerMinute" || metric === "avgCsPerMinute") && !failed) {
    return (
      <img
        src="/images/minion.png"
        alt=""
        width={48}
        height={48}
        className={className + " object-contain"}
        onError={() => setFailed(true)}
      />
    );
  }
  const Icon =
    metric === "avgDeaths"
      ? Skull
      : metric === "winRate"
        ? Trophy
        : metric === "kda"
          ? Swords
          : metric === "avgGoldPerMinute"
            ? Coins
            : metric === "avgDamagePerMinute"
              ? Zap
              : metric === "avgKillParticipation" || metric === "championPool"
                ? Users
                : Crosshair;
  return (
    <Icon aria-hidden="true" className={className + " text-muted-foreground"} strokeWidth={1.5} />
  );
}
