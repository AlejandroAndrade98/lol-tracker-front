import { createFileRoute } from "@tanstack/react-router";
import { FocusPage } from "@/pages/focus";

export const Route = createFileRoute("/focus")({ component: FocusPage });
