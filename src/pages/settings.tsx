import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Fact, PageTitle, Surface } from "@/components/lol-ui";
import { Button } from "@/components/ui/button";
import { refreshActiveApiQueries, useHealth, useSync } from "@/hooks/use-lol-data";
import { api, ApiError, API_BASE_URL, USE_MOCK_DATA } from "@/lib/api";
import { useLastSuccessfulApiFetch } from "@/lib/api-activity";
import { relativeTime } from "@/lib/format";
import type { SyncResult } from "@/types/api";

type ActionState = { tone: "success" | "error"; message: string } | null;

export function SettingsPage() {
  const queryClient = useQueryClient();
  const health = useHealth();
  const sync = useSync();
  const lastFetch = useLastSuccessfulApiFetch();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<ActionState>(null);
  const [isWaking, setIsWaking] = useState(false);

  useEffect(() => {
    if (!health.isFetching || USE_MOCK_DATA) {
      setIsWaking(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setIsWaking(true), 4_000);
    return () => window.clearTimeout(timer);
  }, [health.isFetching]);

  const refreshData = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      await queryClient.fetchQuery({ queryKey: ["health"], queryFn: () => api.getHealth() });
      await refreshActiveApiQueries(queryClient);
      setRefreshResult({ tone: "success", message: "Refreshed" });
    } catch (error) {
      setRefreshResult({ tone: "error", message: friendlyError(error, "Refresh failed") });
    } finally {
      setRefreshing(false);
    }
  };

  const status = USE_MOCK_DATA
    ? "Mock mode"
    : health.isFetching
      ? isWaking
        ? "Waking backend..."
        : "Checking"
      : health.data?.ok
        ? "Connected"
        : "Offline";
  const syncResult: ActionState = sync.isSuccess
    ? { tone: "success", message: syncMessage(sync.data) }
    : null;
  const syncError: ActionState = sync.isError
    ? { tone: "error", message: friendlyError(sync.error, "Sync failed") }
    : null;
  const result = syncError ?? syncResult ?? refreshResult;

  return (
    <div className="space-y-6">
      <PageTitle title="Settings" kicker="Runtime status" />
      <Surface title="API status">
        <div className="grid gap-4 sm:grid-cols-2">
          <Fact label="Status" value={status} />
          <Fact label="API base URL" value={USE_MOCK_DATA ? "No data" : API_BASE_URL} />
          <Fact label="Mock mode" value={USE_MOCK_DATA ? "Enabled" : "Disabled"} />
          <Fact
            label="Last successful fetch"
            value={lastFetch ? relativeTime(lastFetch) : "No data"}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={refreshData}
            disabled={refreshing || sync.isPending}
          >
            <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden="true" />
            {refreshing ? "Refreshing..." : "Refresh data"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => sync.mutate()}
            disabled={sync.isPending || refreshing || USE_MOCK_DATA}
          >
            {sync.isPending ? "Syncing..." : "Manual sync"}
          </Button>
        </div>

        {result ? (
          <p
            className={`mt-4 text-sm ${result.tone === "error" ? "text-warning" : "text-positive"}`}
          >
            {result.message}
          </p>
        ) : null}
        {!USE_MOCK_DATA ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Manual sync is intended for personal use. The backend endpoint is currently
            unauthenticated.
          </p>
        ) : null}
      </Surface>
    </div>
  );
}

function syncMessage(result: SyncResult) {
  const matches = result.newMatchesInserted;
  const timelines = result.timelinesInserted;
  if (matches === null && timelines === null) return "Sync completed";
  if ((matches ?? 0) === 0 && (timelines ?? 0) === 0) return "Sync completed. No new matches";
  const details = [
    matches === null ? null : `${matches} new ${matches === 1 ? "match" : "matches"}`,
    timelines === null ? null : `${timelines} ${timelines === 1 ? "timeline" : "timelines"} added`,
  ].filter((value): value is string => Boolean(value));
  return `Sync completed. ${details.join(", ")}`;
}

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.code === "timeout")
      return "The backend is still waking up. Please try again shortly.";
    return error.message || fallback;
  }
  return fallback;
}
