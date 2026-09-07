import { useSyncExternalStore } from "react";

const LAST_SUCCESSFUL_FETCH_KEY = "lol-tracker:last-successful-fetch";
const listeners = new Set<() => void>();
let lastSuccessfulFetch: string | null = null;

function readStoredTimestamp(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SUCCESSFUL_FETCH_KEY);
}

function snapshot(): string | null {
  if (lastSuccessfulFetch === null) lastSuccessfulFetch = readStoredTimestamp();
  return lastSuccessfulFetch;
}

export function recordSuccessfulApiFetch(timestamp = new Date().toISOString()) {
  lastSuccessfulFetch = timestamp;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_SUCCESSFUL_FETCH_KEY, timestamp);
  }
  listeners.forEach((listener) => listener());
}

export function useLastSuccessfulApiFetch() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot,
    () => null,
  );
}
