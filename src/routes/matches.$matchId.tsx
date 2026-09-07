import { createFileRoute } from "@tanstack/react-router";
import { MatchDetailPage } from "@/pages/match-detail";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchDetailRoute,
});

function MatchDetailRoute() {
  const { matchId } = Route.useParams();
  return <MatchDetailPage matchId={matchId} />;
}
