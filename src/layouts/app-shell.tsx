import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Gauge,
  Goal,
  Home,
  Lightbulb,
  ListOrdered,
  Settings,
  Shield,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";

import { usePlayer, useRank } from "@/hooks/use-lol-data";
import { relativeTime, tierLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/matches", label: "Matches", icon: ListOrdered },
  { to: "/champions", label: "Champions", icon: Trophy },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/roles", label: "Roles", icon: Shield },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/goals", label: "Goals", icon: Goal },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const player = usePlayer();
  const rank = useRank();
  const account = player.data?.player
    ? `${player.data.player.game_name}#${player.data.player.tag_line}`
    : "Jordan Belfort#LAN29";
  const rankText = rank.data?.rank
    ? tierLabel(rank.data.rank.tier, rank.data.rank.division, rank.data.rank.league_points)
    : "Rank unavailable";
  const updatedAt = player.data?.player.last_synced_at ?? rank.data?.rank?.captured_at ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar/95 px-4 py-5 lg:flex lg:flex-col">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold">LoL Tracker</div>
            <div className="text-xs text-muted-foreground">Performance Dashboard</div>
          </div>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Primary navigation">
          {nav.map((item) => {
            const active =
              item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-sidebar-accent text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/settings"
          className={cn(
            "mt-auto flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            location.pathname.startsWith("/settings") && "bg-sidebar-accent text-foreground",
          )}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </Link>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/92 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                LAN · Main role Mid
              </p>
              <h1 className="text-lg font-semibold md:text-xl">{account}</h1>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right sm:flex sm:items-center sm:gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Current rank</p>
                <p className="text-sm font-semibold">{rankText}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="text-sm font-semibold">{relativeTime(updatedAt)}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 pb-24 pt-5 md:px-6 lg:px-8">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-border bg-sidebar/95 px-1 py-2 backdrop-blur lg:hidden"
        aria-label="Mobile navigation"
      >
        {nav.map((item) => {
          const active =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-sidebar-accent text-foreground",
              )}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
