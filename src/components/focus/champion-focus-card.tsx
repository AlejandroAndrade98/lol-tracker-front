import { useState } from "react";
import { Users } from "lucide-react";
import { SampleSizeBadge } from "@/components/lol-ui";
import { nf, pct } from "@/lib/format";
import { useChampionPortrait } from "@/lib/riot-assets";
import type { CoachResponse } from "@/types/api";

export function ChampionFocusCard({
  champion,
}: {
  champion: CoachResponse["recommendedChampionFocus"];
}) {
  return (
    <section aria-labelledby="champion-focus-heading" className="border-t border-border pt-4">
      <h2 id="champion-focus-heading" className="mb-3 text-base font-semibold">
        Champion focus
      </h2>
      {champion ? (
        <ChampionDetails key={champion.championName} champion={champion} />
      ) : (
        <p className="text-sm text-muted-foreground">No champion recommendation yet.</p>
      )}
    </section>
  );
}

function ChampionDetails({
  champion,
}: {
  champion: NonNullable<CoachResponse["recommendedChampionFocus"]>;
}) {
  const portrait = useChampionPortrait(champion.championName);
  const [failed, setFailed] = useState(false);
  return (
    <article className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        {portrait && !failed ? (
          <img
            src={portrait}
            alt={champion.championName}
            width={56}
            height={56}
            className="h-14 w-14 rounded object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className="flex h-14 w-14 items-center justify-center rounded bg-muted"
            aria-hidden="true"
          >
            <Users className="h-7 w-7 text-muted-foreground" />
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold">{champion.championName}</h3>
          <SampleSizeBadge games={champion.games} />
        </div>
      </div>
      <dl className="grid w-full basis-full grid-cols-3 gap-4 text-sm sm:max-w-sm sm:flex-1 sm:basis-auto">
        <div>
          <dt className="text-xs text-muted-foreground">Win rate</dt>
          <dd className="mt-1 font-semibold tabular-nums">{pct(champion.winRate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Games</dt>
          <dd className="mt-1 font-semibold tabular-nums">{champion.games}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">KDA</dt>
          <dd className="mt-1 font-semibold tabular-nums">{nf(champion.kda, 2)}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground sm:ml-auto sm:max-w-60">{champion.reason}</p>
    </article>
  );
}
