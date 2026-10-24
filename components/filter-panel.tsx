"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FilterDimensions } from "@/hooks/use-filter";
import { faDigits, faInt, normalizeDigits } from "@/lib/format";
import { filtersHref, parseFilters, toggleValue, type FilterErrors } from "@/lib/filters";
import { BODY_CONDITIONS, CONDITION_LABELS, PAYMENT_LABELS, PAYMENT_METHODS } from "@/lib/labels";
import type { BrandOption } from "@/lib/types";
import { CheckIcon } from "./icons";

export const PRICE_SLIDER_MAX = 15_000;
const PRICE_STEP = 50;
const YEARS = Array.from({ length: 1405 - 1390 + 1 }, (_, i) => 1405 - i);

type Draft = {
  brand: string[];
  min: string;
  max: string;
  yearMin: string;
  yearMax: string;
  condition: string[];
  payment: string[];
  q: string;
};

type ListKey = "brand" | "condition" | "payment";
type TextKey = Exclude<keyof Draft, ListKey>;

export function toDraft(f: FilterDimensions): Draft {
  return {
    brand: f.brand ?? [],
    min: f.min ?? "",
    max: f.max ?? "",
    yearMin: f.yearMin ? String(f.yearMin) : "",
    yearMax: f.yearMax ? String(f.yearMax) : "",
    condition: f.condition ?? [],
    payment: f.payment ?? [],
    q: f.q ?? "",
  };
}

function validate(draft: Draft) {
  return parseFilters(draft);
}

export function useFilterDraft(applied: FilterDimensions) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(applied));
  const appliedKey = filtersHref({ ...applied });
  const [syncedKey, setSyncedKey] = useState(appliedKey);
  if (syncedKey !== appliedKey) {
    setSyncedKey(appliedKey);
    setDraft(toDraft(applied));
  }
  return [draft, setDraft] as const;
}

export function FilterFields({
  draft,
  setDraft,
  brands,
  errors,
  layout,
  showSearch,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  brands: BrandOption[];
  errors: FilterErrors;
  layout: "sheet" | "sidebar";
  showSearch?: boolean;
}) {
  const ids = useId();
  const set = (key: TextKey) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const toggle = (key: ListKey) => (value: string) => setDraft((d) => ({ ...d, [key]: toggleValue(d[key], value) ?? [] }));
  const clear = (key: ListKey) => () => setDraft((d) => ({ ...d, [key]: [] }));
  const minNum = Number(normalizeDigits(draft.min || "0")) || 0;
  const maxNum = draft.max ? Number(normalizeDigits(draft.max)) || PRICE_SLIDER_MAX : PRICE_SLIDER_MAX;

  return (
    <div className="flex flex-col gap-7">
      {showSearch && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-q`} className="font-bold">
            جستجو
          </label>
          <input
            id={`${ids}-q`}
            type="search"
            className="field"
            placeholder="جستجوی برند یا مدل"
            maxLength={100}
            value={draft.q}
            onChange={(e) => set("q")(e.target.value)}
          />
          {errors.q && <FieldError>{errors.q}</FieldError>}
        </div>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-bold">برند</legend>
        <div
          role="group"
          aria-label="برند"
          className={layout === "sheet" ? "flex flex-wrap gap-2" : "flex flex-col gap-1"}
        >
          {[{ slug: "", nameFa: "همه برندها", count: -1 } as const, ...brands].map((b) => {
            const isAll = !b.slug;
            const checked = isAll ? draft.brand.length === 0 : draft.brand.includes(b.nameFa);
            const onClick = isAll ? clear("brand") : () => toggle("brand")(b.nameFa);
            return layout === "sheet" ? (
              <button
                key={b.slug || "all"}
                type="button"
                role="checkbox"
                aria-checked={checked}
                className="chip"
                onClick={onClick}
              >
                {isAll ? "همه" : b.nameFa}
              </button>
            ) : (
              <button
                key={b.slug || "all"}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={onClick}
                className="tap flex items-center justify-between gap-3 rounded-button px-2 text-start hover:bg-chip"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`grid size-5 shrink-0 place-items-center rounded-md border-2 text-surface ${checked ? "border-ink bg-ink" : "border-border bg-surface"}`}
                  >
                    {checked && <CheckIcon size={12} strokeWidth={3} />}
                  </span>
                  {b.nameFa}
                </span>
                {b.count >= 0 && <span className="meta">{faDigits(b.count)}</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-bold">
          قیمت <span className="font-normal text-muted">· میلیون تومان</span>
        </legend>
        <div className="range-dual" aria-hidden="true">
          <input
            type="range"
            tabIndex={-1}
            min={0}
            max={PRICE_SLIDER_MAX}
            step={PRICE_STEP}
            value={Math.min(minNum, PRICE_SLIDER_MAX)}
            onChange={(e) => {
              const v = Math.min(Number(e.target.value), maxNum - PRICE_STEP);
              set("min")(v <= 0 ? "" : String(v));
            }}
          />
          <input
            type="range"
            tabIndex={-1}
            min={0}
            max={PRICE_SLIDER_MAX}
            step={PRICE_STEP}
            value={Math.min(maxNum, PRICE_SLIDER_MAX)}
            onChange={(e) => {
              const v = Math.max(Number(e.target.value), minNum + PRICE_STEP);
              set("max")(v >= PRICE_SLIDER_MAX ? "" : String(v));
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField id={`${ids}-min`} label="از" value={draft.min} onChange={set("min")} placeholder="۰" invalid={!!errors.min} />
          <NumberField
            id={`${ids}-max`}
            label="تا"
            value={draft.max}
            onChange={set("max")}
            placeholder={faInt(PRICE_SLIDER_MAX)}
            invalid={!!errors.max}
          />
        </div>
        {(errors.min || errors.max) && <FieldError>{errors.min ?? errors.max}</FieldError>}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-bold">
          سال ساخت <span className="font-normal text-muted">· شمسی</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <YearSelect id={`${ids}-ymin`} label="از" value={draft.yearMin} onChange={set("yearMin")} invalid={!!errors.yearMin} />
          <YearSelect id={`${ids}-ymax`} label="تا" value={draft.yearMax} onChange={set("yearMax")} invalid={!!errors.yearMax} />
        </div>
        {(errors.yearMin || errors.yearMax) && <FieldError>{errors.yearMin ?? errors.yearMax}</FieldError>}
      </fieldset>

      <ChipGroup
        legend="وضعیت بدنه"
        values={draft.condition}
        onToggle={toggle("condition")}
        onClear={clear("condition")}
        options={BODY_CONDITIONS.filter((c) => c !== "unknown").map((c) => ({ value: c, label: CONDITION_LABELS[c] }))}
      />

      <ChipGroup
        legend="روش پرداخت"
        values={draft.payment}
        onToggle={toggle("payment")}
        onClear={clear("payment")}
        options={PAYMENT_METHODS.map((p) => ({ value: p, label: PAYMENT_LABELS[p] }))}
      />
    </div>
  );
}

function ChipGroup({
  legend,
  values,
  onToggle,
  onClear,
  options,
}: {
  legend: string;
  values: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-bold">{legend}</legend>
      <div role="group" aria-label={legend} className="flex flex-wrap gap-2">
        <button type="button" role="checkbox" aria-checked={values.length === 0} className="chip" onClick={onClear}>
          همه
        </button>
        {options.map((o) => (
          <button key={o.value} type="button" role="checkbox" aria-checked={values.includes(o.value)} className="chip" onClick={() => onToggle(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  invalid: boolean;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 font-bold">
        {label}
      </label>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        className="field h-14 ps-12 font-bold"
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value ? faDigits(value).replace(".", "٫") : ""}
        onChange={(e) => onChange(normalizeDigits(e.target.value).replace(/[^\d.]/g, ""))}
      />
    </div>
  );
}

function YearSelect({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted">
        {label}
      </label>
      <select
        id={id}
        className="field h-14 appearance-none ps-12"
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">همه</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {faDigits(y)}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger-ink">
      {children}
    </p>
  );
}

/** Live total for the current draft, used for the "show N cars" button. */
export function useDraftCount(draft: Draft, enabled: boolean) {
  const parsed = useMemo(() => validate(draft), [draft]);
  const query = parsed.ok ? filtersHref({ ...parsed.filters, page: 1, limit: 10 }, "/api/cars") : null;
  const [result, setResult] = useState<{ query: string; total: number } | null>(null);

  useEffect(() => {
    if (!enabled || !query) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(query, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { total: number };
        setResult({ query, total: data.total });
      } catch {
        // Aborted or offline: the button falls back to a generic label.
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);

  return {
    parsed,
    total: result && result.query === query ? result.total : null,
  };
}

export function draftToDimensions(draft: Draft): FilterDimensions | null {
  const parsed = validate(draft);
  if (!parsed.ok) return null;
  const { sort: _s, page: _p, limit: _l, ...dims } = parsed.filters;
  return dims;
}

export type { Draft };
