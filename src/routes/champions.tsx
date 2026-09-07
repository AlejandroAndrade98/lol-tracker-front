import { createFileRoute } from "@tanstack/react-router";
import { ChampionsPage } from "@/pages/champions";

export const Route = createFileRoute("/champions")({ component: ChampionsPage });
