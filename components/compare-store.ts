"use client";

import { useSyncExternalStore } from "react";
import { MAX_COMPARE_IDS } from "@/lib/compare-limits";

export const MAX_COMPARE = MAX_COMPARE_IDS;
const KEY = "automl:compare";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.ids;
  let ids: string[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) ids = parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_COMPARE);
  } catch {
    ids = EMPTY;
  }
  cache = { raw, ids };
  return ids;
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private mode); selection then lasts only until reload.
  }
  cache = { raw: JSON.stringify(ids), ids };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCompareIds(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function toggleCompare(id: string): "added" | "removed" | "full" {
  const ids = read();
  if (ids.includes(id)) {
    write(ids.filter((x) => x !== id));
    return "removed";
  }
  if (ids.length >= MAX_COMPARE) return "full";
  write([...ids, id]);
  return "added";
}

export function setCompareIds(ids: string[]) {
  write([...new Set(ids)].slice(0, MAX_COMPARE));
}

export function clearCompare() {
  write([]);
}
