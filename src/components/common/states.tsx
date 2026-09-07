import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/60 bg-card/70 backdrop-blur", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function LoadingCard({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorCard({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: (() => void) | undefined;
}) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <div className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangle className="h-4 w-4" /> No se pudieron cargar los datos
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
      <Inbox className="h-5 w-5" />
      {message}
    </div>
  );
}

export function NotEnoughData({ games, needed }: { games: number; needed: number }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
      Muestra insuficiente: {games} partidas registradas, se necesitan al menos {needed} para una
      conclusión fiable.
    </div>
  );
}

export function QueryBoundary({
  isLoading,
  error,
  isEmpty,
  emptyMessage = "Sin datos todavía",
  onRetry,
  children,
  loadingRows = 3,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: (() => void) | undefined;
  children: ReactNode;
  loadingRows?: number;
}) {
  if (isLoading) return <LoadingBlock rows={loadingRows} />;
  if (error) return <ErrorCard error={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState message={emptyMessage} />;
  return <>{children}</>;
}
