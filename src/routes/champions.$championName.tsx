import { createFileRoute } from "@tanstack/react-router";
import { ChampionDetailPage } from "@/pages/champion-detail";

export const Route = createFileRoute("/champions/$championName")({
  component: ChampionDetailRoute,
});

function ChampionDetailRoute() {
  const { championName } = Route.useParams();
  return <ChampionDetailPage championName={championName} />;
}
