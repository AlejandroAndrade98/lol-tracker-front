import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Fact, PageTitle, Surface } from "@/components/lol-ui";
import { useHealth, useSync } from "@/hooks/use-lol-data";
import { API_BASE_URL, USE_MOCK_DATA } from "@/lib/api";
import { relativeTime } from "@/lib/format";

const LAST_FETCH_KEY = "lol-tracker:last-successful-fetch";

export function SettingsPage() {
  const health = useHealth();
  const sync = useSync();
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  useEffect(() => {
    setLastFetch(localStorage.getItem(LAST_FETCH_KEY));
  }, []);

  useEffect(() => {
    if (health.data?.ok) {
      const now = new Date().toISOString();
      localStorage.setItem(LAST_FETCH_KEY, now);
      setLastFetch(now);
    }
  }, [health.data?.ok]);

  return (
    <div className="space-y-6">
      <PageTitle title="Settings" kicker="Runtime status" />
      <section className="grid gap-4 lg:grid-cols-2">
        <Surface title="API status" description="Frontend reads through the REST API only.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Fact
              label="Status"
              value={health.isLoading ? "Checking" : health.data?.ok ? "Online" : "Unavailable"}
            />
            <Fact label="API base URL" value={API_BASE_URL} />
            <Fact label="Mock mode" value={USE_MOCK_DATA ? "Enabled" : "Disabled"} />
            <Fact
              label="Last successful fetch"
              value={lastFetch ? relativeTime(lastFetch) : "No data"}
            />
          </div>
          {health.error ? (
            <p className="mt-4 text-sm text-warning">
              API status could not be loaded. Build and navigation still work without the backend
              running.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => health.refetch()}>
              Refresh data
            </Button>
            <Button
              variant="ghost"
              onClick={() => sync.mutate()}
              disabled={sync.isPending || USE_MOCK_DATA}
            >
              {sync.isPending ? "Syncing" : "Manual sync"}
            </Button>
          </div>
        </Surface>
        <Surface title="Production notes">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Set VITE_API_BASE_URL in Vercel to the deployed backend origin.</p>
            <p>
              Keep VITE_USE_MOCK_DATA=false for real data. Mock mode is only for local UI
              development.
            </p>
            <p>
              The backend must allow the Vercel frontend origin with CORS. The frontend does not
              proxy API traffic.
            </p>
          </div>
        </Surface>
      </section>
    </div>
  );
}
