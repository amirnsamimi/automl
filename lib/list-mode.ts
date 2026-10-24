"use client";

import { useSyncExternalStore } from "react";

/**
 * Presentation-only browsing state for /cars, kept in sessionStorage:
 * once a visitor uses numbered pagination for a query, that query stays in explicit mode.
 */
const PREFIX = "automl:explicit:";
const FOCUS_KEY = "automl:focus-list";
const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function notify() {
  listeners.forEach((l) => l());
}

/** No notification: the flag is picked up by the render that the page navigation triggers. */
export function markExplicit(queryKey: string) {
  storage()?.setItem(PREFIX + queryKey, "1");
}

export function clearListModes() {
  const s = storage();
  if (!s) return;
  for (let i = s.length - 1; i >= 0; i--) {
    const key = s.key(i);
    if (key?.startsWith(PREFIX)) s.removeItem(key);
  }
  notify();
}

export function useExplicitMode(queryKey: string): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => storage()?.getItem(PREFIX + queryKey) === "1",
    () => false,
  );
}

export function requestListFocus() {
  storage()?.setItem(FOCUS_KEY, "1");
}

export function consumeListFocus(): boolean {
  const s = storage();
  if (s?.getItem(FOCUS_KEY) !== "1") return false;
  s.removeItem(FOCUS_KEY);
  return true;
}
