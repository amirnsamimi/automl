"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { faDigits } from "@/lib/format";
import { DEFAULT_LIMIT, filtersHref, hasActiveFilters, type Filters, type Limit } from "@/lib/filters";
import { consumeListFocus, useExplicitMode } from "@/lib/list-mode";
import type { CarListResult, CarSummary } from "@/lib/types";
import { CarCard, CarCardSkeleton } from "./car-card";
import { AlertIcon } from "./icons";
import { Pagination } from "./pagination";
import { RevealList } from "./motion/reveal-list";

type CarListProps = {
  result: CarListResult;
  filters: Filters;
  queryKey: string;
  pending: boolean;
  onPage: (page: number, queryKey: string) => void;
  onLimit: (limit: Limit, queryKey: string) => void;
  onReset: () => void;
};

type AppendState = { status: "idle" | "loading" | "done" | "error"; items: CarSummary[] };

function dedupe(items: CarSummary[]) {
  const seen = new Set<string>();
  return items.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

export function CarList({ result, filters, queryKey, pending, onPage, onLimit, onReset }: CarListProps) {
  const explicit = useExplicitMode(queryKey);
  const autoMode = !explicit && filters.page === 1 && filters.limit === DEFAULT_LIMIT;
  const [append, setAppend] = useState<AppendState>({ status: "idle", items: [] });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canAppend = autoMode && result.hasNext && append.status !== "done";

  const loadMore = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAppend((s) => ({ ...s, status: "loading" }));
    try {
      const res = await fetch(filtersHref({ ...filters, page: 2, limit: DEFAULT_LIMIT }, "/api/cars"), { signal: controller.signal });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as CarListResult;
      if (controller.signal.aborted) return;
      setAppend({ status: "done", items: data.items });
    } catch (error) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
      setAppend((s) => ({ ...s, status: "error" }));
    }
  }, [filters]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!canAppend || append.status !== "idle" || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          void loadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canAppend, append.status, loadMore]);

  const headingFocus = useRef(false);
  useEffect(() => {
    if (headingFocus.current) return;
    headingFocus.current = true;
    if (consumeListFocus()) document.getElementById("results-heading")?.focus({ preventScroll: false });
  }, []);

  const items = autoMode ? dedupe([...result.items, ...append.items]) : result.items;
  const shownFrom = items.length === 0 ? 0 : autoMode ? 1 : (filters.page - 1) * filters.limit + 1;
  const shownTo = autoMode ? items.length : (filters.page - 1) * filters.limit + items.length;
  const appendedBoundary = autoMode && append.status === "done";
  const showPagination = !autoMode || (appendedBoundary && shownTo < result.total);
  const currentPage = autoMode ? (appendedBoundary ? 2 : 1) : filters.page;

  if (result.total === 0) return <EmptyState filters={filters} onReset={onReset} />;

  return (
    <div className="flex flex-col gap-6" aria-busy={pending || append.status === "loading"}>
      <p className="sr-only" role="status" aria-live="polite">
        {pending ? "در حال بارگذاری نتایج" : `نمایش ${faDigits(shownFrom)} تا ${faDigits(shownTo)} از ${faDigits(result.total)} خودرو`}
      </p>
      <p className="meta hidden text-sm lg:block" aria-hidden="true">
        نمایش {faDigits(shownFrom)} تا {faDigits(shownTo)} از {faDigits(result.total)} خودرو
      </p>

      <RevealList
        className={`grid gap-4 transition-opacity duration-200 md:grid-cols-2 xl:grid-cols-3 ${pending ? "opacity-50" : ""}`}
        itemKeys={items.map((c) => c.id)}
      >
        {items.map((car, i) => (
          <li key={car.id} data-reveal-item>
            <CarCard car={car} priority={i < 2} />
          </li>
        ))}
        {append.status === "loading" &&
          Array.from({ length: 2 }, (_, i) => (
            <li key={`skeleton-${i}`}>
              <CarCardSkeleton />
            </li>
          ))}
      </RevealList>

      {canAppend && append.status === "idle" && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {append.status === "error" && (
        <div role="alert" className="card flex flex-col items-start gap-3 p-6">
          <p className="flex items-center gap-2 font-bold">
            <AlertIcon className="text-danger-ink" />
            بارگذاری خودروهای بیشتر ناموفق بود.
          </p>
          <p className="text-sm text-muted">فیلترهای شما حفظ شده‌اند.</p>
          <button type="button" className="pill-solid" onClick={() => void loadMore()}>
            تلاش دوباره
          </button>
        </div>
      )}

      {appendedBoundary && shownTo < result.total && (
        <div className="rounded-card bg-mint p-6">
          <p className="text-xl font-black">{faDigits(shownTo)} خودرو را دیدید</p>
          <p className="mt-2 text-sm text-muted">برای ادامه، صفحه بعد را انتخاب کنید.</p>
          <button
            type="button"
            className="tap mt-2 text-sm font-bold text-green underline-offset-4 hover:underline"
            onClick={() => onPage(3, queryKey)}
          >
            ادامه با صفحه‌بندی
          </button>
        </div>
      )}

      {autoMode && shownTo >= result.total && (!result.hasNext || appendedBoundary) && (
        <p className="meta text-center">همه {faDigits(result.total)} خودرو نمایش داده شد.</p>
      )}

      {showPagination && (
        <Pagination
          page={currentPage}
          limit={filters.limit}
          total={result.total}
          onPage={(p) => onPage(p, queryKey)}
          onLimit={(l) => onLimit(l, queryKey)}
          hrefFor={(p) => filtersHref({ ...filters, page: p })}
        />
      )}
    </div>
  );
}

function EmptyState({ filters, onReset }: { filters: Filters; onReset: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
      <p className="text-xl font-black">خودرویی با این فیلترها پیدا نشد</p>
      <p className="max-w-sm text-sm text-muted">
        فیلترهای انتخابی شما حفظ شده‌اند. بازه قیمت یا سال را بازتر کنید یا برند دیگری را امتحان کنید.
      </p>
      {hasActiveFilters(filters) && (
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="pill-solid" onClick={onReset}>
            پاک کردن فیلترها
          </button>
          <Link href="/cars" className="pill-ghost">
            همه خودروها
          </Link>
        </div>
      )}
    </div>
  );
}
