"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFilter, type FilterDimensions } from "@/hooks/use-filter";
import { faDigits } from "@/lib/format";
import { activeFilterCount, filtersHref, queryKey, toggleValue, type FilterErrors, type Filters } from "@/lib/filters";
import { SORT_OPTIONS } from "@/lib/labels";
import type { BrandOption, CarListResult } from "@/lib/types";
import { CarList } from "./car-list";
import { CompareTray } from "./compare-tray";
import { draftToDimensions, FilterFields, toDraft, useDraftCount, useFilterDraft } from "./filter-panel";
import { AlertIcon, FilterIcon, SearchIcon, SortIcon } from "./icons";
import { Sheet } from "./sheet";

type InventoryViewProps = {
  filters: Filters;
  brands: BrandOption[];
  result: CarListResult | null;
  errors?: FilterErrors;
  canonicalHref: string;
};

function dimensionsOf({ sort: _s, page: _p, limit: _l, ...dims }: Filters): FilterDimensions {
  return dims;
}

export function InventoryView({ filters, brands, result, errors, canonicalHref }: InventoryViewProps) {
  const nav = useFilter(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const key = queryKey(filters);

  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search ? `?${new URLSearchParams(window.location.search)}` : ""}`;
    if (current !== canonicalHref) nav.replace(filters);
    // Canonicalize once per server result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalHref]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label;
  const activeCount = activeFilterCount(filters);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[320px_1fr] lg:px-8">
      <aside className="hidden lg:block" aria-label="فیلترها">
        <div className="card sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 pb-2 pt-6">
            <h2 className="text-xl font-black">فیلترها</h2>
            <FilterIcon className="text-muted" />
          </div>
          <SidebarFilters key={filtersHref(filters)} filters={filters} brands={brands} onApply={nav.apply} onReset={nav.reset} errors={errors} />
        </div>
      </aside>

      <section aria-labelledby="results-heading" className="flex min-w-0 flex-col gap-5">
        <SearchBox key={filters.q ?? ""} initial={filters.q ?? ""} onSearch={(q) => nav.update({ q: q || undefined })} />

        <div role="group" aria-label="برند" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
          <button type="button" role="checkbox" aria-checked={!filters.brand?.length} className="chip" onClick={() => nav.update({ brand: undefined })}>
            همه
          </button>
          {brands.map((b) => (
            <button
              key={b.slug}
              type="button"
              role="checkbox"
              aria-checked={filters.brand?.includes(b.nameFa) ?? false}
              className="chip"
              onClick={() => nav.update({ brand: toggleValue(filters.brand, b.nameFa) })}
            >
              {b.nameFa}
            </button>
          ))}
        </div>

        <div className="flex items-end justify-between gap-3">
          <h2 id="results-heading" tabIndex={-1} className="text-2xl font-black focus:outline-none lg:text-3xl">
            موجودی خودروها
          </h2>
          {result && (
            <p className="meta text-sm" aria-hidden="true">
              {faDigits(result.total)} خودرو
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:justify-start">
          <button type="button" className="pill-ghost relative lg:hidden" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
            <FilterIcon size={20} />
            فیلترها
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-green text-[11px] text-surface">
                <span className="sr-only">فیلتر فعال: </span>
                {faDigits(activeCount)}
              </span>
            )}
          </button>
          <button type="button" className="pill-ghost whitespace-nowrap lg:min-w-64" onClick={() => setSortOpen(true)} aria-haspopup="dialog">
            <SortIcon size={18} />
            <span>
              <span className="sr-only sm:not-sr-only">مرتب‌سازی: </span>
              {sortLabel}
            </span>
          </button>
        </div>

        {errors ? (
          <InvalidQuery errors={errors} />
        ) : result ? (
          <CarList key={filtersHref(filters)} result={result} filters={filters} queryKey={key} pending={nav.isPending} onPage={nav.goToPage} onLimit={nav.setLimit} onReset={nav.reset} />
        ) : null}
      </section>

      <MobileFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        brands={brands}
        onApply={(dims) => {
          setFiltersOpen(false);
          nav.apply(dims);
        }}
        onReset={() => {
          setFiltersOpen(false);
          nav.reset();
        }}
      />

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="مرتب‌سازی">
        <div role="radiogroup" aria-label="مرتب‌سازی" className="flex flex-col gap-2 pb-4">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={filters.sort === o.value}
              data-autofocus={filters.sort === o.value ? "" : undefined}
              className="tap flex items-center justify-between rounded-button border border-border px-5 py-3 text-start aria-checked:border-ink aria-checked:bg-ink aria-checked:text-surface"
              onClick={() => {
                setSortOpen(false);
                if (o.value !== filters.sort) nav.setSort(o.value);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Sheet>

      <CompareTray />
    </div>
  );
}

function SearchBox({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <label htmlFor="inventory-search" className="sr-only">
        جستجوی برند یا مدل
      </label>
      <SearchIcon className="pointer-events-none absolute start-5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        id="inventory-search"
        type="search"
        enterKeyHint="search"
        maxLength={100}
        className="tap h-14 w-full rounded-full border border-border bg-surface pe-5 ps-14 text-base placeholder:text-muted focus:border-green focus:outline-none"
        placeholder="جستجوی برند یا مدل"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}

function SidebarFilters({
  filters,
  brands,
  onApply,
  onReset,
  errors: serverErrors,
}: {
  filters: Filters;
  brands: BrandOption[];
  onApply: (d: FilterDimensions) => void;
  onReset: () => void;
  errors?: FilterErrors;
}) {
  const [draft, setDraft] = useFilterDraft(dimensionsOf(filters));
  const { parsed, total } = useDraftCount(draft, true);
  const errors = parsed.ok ? {} : parsed.errors;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <FilterFields draft={draft} setDraft={setDraft} brands={brands} errors={{ ...serverErrors, ...errors }} layout="sidebar" />
      </div>
      <div className="flex gap-3 border-t border-border bg-surface p-4">
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={!parsed.ok}
          onClick={() => {
            const dims = draftToDimensions(draft);
            if (dims) onApply(dims);
          }}
        >
          {total === null ? "اعمال فیلتر" : `نمایش ${faDigits(total)} خودرو`}
        </button>
        <button type="button" className="btn-secondary" onClick={onReset}>
          پاک کردن
        </button>
      </div>
    </>
  );
}

function MobileFilterSheet({
  open,
  onClose,
  filters,
  brands,
  onApply,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  brands: BrandOption[];
  onApply: (d: FilterDimensions) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useFilterDraft(dimensionsOf(filters));
  const { parsed, total } = useDraftCount(draft, open);
  const errors = parsed.ok ? {} : parsed.errors;

  return (
    <Sheet
      open={open}
      onClose={() => {
        onClose();
        setDraft(toDraft(dimensionsOf(filters)));
      }}
      title="فیلتر خودروها"
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!parsed.ok}
              onClick={() => {
                const dims = draftToDimensions(draft);
                if (dims) onApply(dims);
              }}
            >
              {total === null ? "اعمال فیلتر" : `نمایش ${faDigits(total)} خودرو`}
            </button>
            <button type="button" className="btn-secondary" onClick={onReset}>
              پاک کردن
            </button>
          </div>
          <p className="meta text-center">فیلترها پس از تأیید اعمال می‌شوند.</p>
        </div>
      }
    >
      <FilterFields draft={draft} setDraft={setDraft} brands={brands} errors={errors} layout="sheet" />
    </Sheet>
  );
}

function InvalidQuery({ errors }: { errors: FilterErrors }) {
  return (
    <div role="alert" className="card flex flex-col items-start gap-3 border-danger-ink/20 p-6">
      <div className="flex items-center gap-2 font-bold text-danger-ink">
        <AlertIcon />
        پارامترهای جستجو معتبر نیستند
      </div>
      <ul className="list-inside list-disc text-sm text-muted">
        {Object.entries(errors).map(([field, message]) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
      <Link href="/cars" className="pill-solid">
        نمایش همه خودروها
      </Link>
    </div>
  );
}
