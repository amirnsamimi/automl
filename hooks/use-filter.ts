"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { DEFAULT_LIMIT, filtersHref, type Filters, type Limit, type Sort } from "@/lib/filters";
import { clearListModes, markExplicit, requestListFocus } from "@/lib/list-mode";

export type FilterDimensions = Omit<Filters, "sort" | "page" | "limit">;

/** Application-level URL state for /cars. The URL is the single source of applied filters. */
export function useFilter(filters: Filters) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const go = useCallback(
    (next: Filters, history: "push" | "replace" = "push") => {
      const href = filtersHref(next);
      startTransition(() => {
        if (history === "push") router.push(href, { scroll: false });
        else router.replace(href, { scroll: false });
      });
    },
    [router],
  );

  /** Applies a new filter set; paging and the append budget reset. */
  const apply = useCallback(
    (dims: FilterDimensions) => {
      clearListModes();
      go({ ...dims, sort: filters.sort, page: 1, limit: DEFAULT_LIMIT });
    },
    [filters.sort, go],
  );

  const update = useCallback(
    (patch: Partial<FilterDimensions>) => {
      clearListModes();
      go({ ...filters, ...patch, page: 1, limit: DEFAULT_LIMIT });
    },
    [filters, go],
  );

  const search = useCallback(
    (q: string, history: "push" | "replace") => {
      clearListModes();
      go({ ...filters, q: q || undefined, page: 1, limit: DEFAULT_LIMIT }, history);
    },
    [filters, go],
  );

  const setSort = useCallback(
    (sort: Sort) => {
      clearListModes();
      go({ ...filters, sort, page: 1, limit: DEFAULT_LIMIT });
    },
    [filters, go],
  );

  const goToPage = useCallback(
    (page: number, queryKey: string) => {
      markExplicit(queryKey);
      requestListFocus();
      startTransition(() => router.push(filtersHref({ ...filters, page }), { scroll: false }));
    },
    [filters, router],
  );

  const setLimit = useCallback(
    (limit: Limit, queryKey: string) => {
      markExplicit(queryKey);
      requestListFocus();
      go({ ...filters, limit, page: 1 });
    },
    [filters, go],
  );

  const reset = useCallback(() => {
    clearListModes();
    go({ sort: filters.sort, page: 1, limit: DEFAULT_LIMIT });
  }, [filters.sort, go]);

  return { filters, isPending, apply, update, search, setSort, goToPage, setLimit, reset, replace: (f: Filters) => go(f, "replace") };
}
