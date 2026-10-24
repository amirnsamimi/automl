"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type Options = {
  /** Quiet period after the last call before `fn` runs. */
  wait: number;
  /** Throttle bound: during continuous calls `fn` still runs at least this often, and never more often. */
  maxWait: number;
};

/** Milliseconds until a pending call should run, given when the burst started and when `fn` last ran. */
export function debounceDelay(now: number, burstStart: number, lastRun: number, { wait, maxWait }: Options): number {
  const untilDue = Math.min(wait, burstStart + maxWait - now);
  const untilThrottleOpen = lastRun + maxWait - now;
  return Math.max(untilDue, untilThrottleOpen, 0);
}

/** Trailing debounce with a max-wait throttle. Only the latest arguments are delivered. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, { wait, maxWait }: Options) {
  const fnRef = useRef(fn);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgs = useRef<A | null>(null);
  const firstCallAt = useRef<number | null>(null);
  const lastRunAt = useRef(0);

  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    firstCallAt.current = null;
    const args = pendingArgs.current;
    pendingArgs.current = null;
    if (!args) return;
    lastRunAt.current = Date.now();
    fnRef.current(...args);
  }, []);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    firstCallAt.current = null;
    pendingArgs.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const call = useCallback(
    (...args: A) => {
      const now = Date.now();
      pendingArgs.current = args;
      firstCallAt.current ??= now;
      const delay = debounceDelay(now, firstCallAt.current, lastRunAt.current, { wait, maxWait });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(run, delay);
    },
    [maxWait, run, wait],
  );

  return { call, cancel };
}
