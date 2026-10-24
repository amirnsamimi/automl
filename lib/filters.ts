import { z } from "zod";
import { BODY_CONDITIONS, PAYMENT_METHODS, SORT_OPTIONS } from "./labels";
import { normalizeDigits, normalizeText } from "./format";

export const SORT_VALUES = SORT_OPTIONS.map((o) => o.value) as [Sort, ...Sort[]];
export type Sort = (typeof SORT_OPTIONS)[number]["value"];
export const LIMIT_VALUES = [10, 20, 50] as const;
export type Limit = (typeof LIMIT_VALUES)[number];

export const DEFAULT_SORT: Sort = "newest";
export const DEFAULT_LIMIT: Limit = 10;
export const MAX_QUERY_LENGTH = 100;
export const MAX_PAGE = 10_000;
const MAX_MILLION_TOMAN = 1_000_000n;
const YEAR_MIN = 1300;
const YEAR_MAX = 1500;

export type BodyConditionFilter = (typeof BODY_CONDITIONS)[number];
export type PaymentFilter = (typeof PAYMENT_METHODS)[number];

export type Filters = {
  /** Any of these brands; canonical order is set by the caller after resolving aliases. */
  brand?: string[];
  /** Million toman, canonical ASCII decimal string. */
  min?: string;
  max?: string;
  yearMin?: number;
  yearMax?: number;
  /** Any of these conditions, in enum order. */
  condition?: BodyConditionFilter[];
  /** Cars offering any of these methods, in enum order. */
  payment?: PaymentFilter[];
  q?: string;
  sort: Sort;
  page: number;
  limit: Limit;
};

export type FilterField = keyof Filters;
export type FilterErrors = Partial<Record<FilterField, string>>;
export type ParseResult = { ok: true; filters: Filters } | { ok: false; errors: FilterErrors; filters: Filters };

export const DEFAULT_FILTERS: Filters = { sort: DEFAULT_SORT, page: 1, limit: DEFAULT_LIMIT };

/** Order of parameters in canonical URLs. */
const PARAM_ORDER: FilterField[] = [
  "brand",
  "min",
  "max",
  "yearMin",
  "yearMax",
  "condition",
  "payment",
  "q",
  "sort",
  "page",
  "limit",
];

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

const LIST_FIELDS = new Set<FilterField>(["brand", "condition", "payment"]);
const MAX_LIST_ITEMS = 20;

function readAll(raw: RawParams, key: string): string[] {
  if (raw instanceof URLSearchParams) return raw.getAll(key);
  const value = raw[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function read(raw: RawParams, key: string): string | undefined {
  const first = readAll(raw, key)[0];
  if (first === undefined) return undefined;
  const trimmed = normalizeText(first);
  return trimmed === "" ? undefined : trimmed;
}

/** Accepts repeated params and comma-separated values (Latin or Persian comma); dedupes. */
function readList(raw: RawParams, key: string): string[] | undefined {
  const items = readAll(raw, key)
    .flatMap((v) => v.split(/[,،]/))
    .map(normalizeText)
    .filter(Boolean);
  return items.length > 0 ? [...new Set(items)] : undefined;
}

function enumOrdered<T extends string>(order: readonly T[]) {
  return (values: T[]) => order.filter((v) => values.includes(v));
}

const millionSchema = z
  .string()
  .transform((v) => normalizeDigits(v).replace(/,/g, ""))
  .pipe(z.string().regex(/^\d+(\.\d{1,6})?$/, "عدد نامعتبر است"))
  .transform(canonicalDecimal)
  .refine((v) => millionToToman(v) <= MAX_MILLION_TOMAN * 1_000_000n, "مقدار بیش از حد بزرگ است");

const yearSchema = z
  .string()
  .transform((v) => normalizeDigits(v))
  .pipe(z.string().regex(/^\d{4}$/, "سال باید چهار رقمی باشد"))
  .transform(Number)
  .pipe(z.number().int().min(YEAR_MIN, "سال نامعتبر است").max(YEAR_MAX, "سال نامعتبر است"));

const pageSchema = z
  .string()
  .transform((v) => normalizeDigits(v))
  .pipe(z.string().regex(/^\d+$/, "شماره صفحه نامعتبر است"))
  .transform(Number)
  .pipe(z.number().int().min(1, "شماره صفحه نامعتبر است").max(MAX_PAGE, "شماره صفحه نامعتبر است"));

const limitSchema = z
  .string()
  .transform((v) => Number(normalizeDigits(v)))
  .pipe(z.union(LIMIT_VALUES.map((n) => z.literal(n)) as [z.ZodLiteral<10>, z.ZodLiteral<20>, z.ZodLiteral<50>]));

const fieldSchemas = {
  brand: z.array(z.string().max(120, "نام برند طولانی است")).max(MAX_LIST_ITEMS, "تعداد برندها زیاد است"),
  min: millionSchema,
  max: millionSchema,
  yearMin: yearSchema,
  yearMax: yearSchema,
  condition: z
    .array(z.enum(BODY_CONDITIONS, { error: "وضعیت بدنه نامعتبر است" }))
    .transform(enumOrdered(BODY_CONDITIONS)),
  payment: z
    .array(z.enum(PAYMENT_METHODS, { error: "روش پرداخت نامعتبر است" }))
    .transform(enumOrdered(PAYMENT_METHODS)),
  q: z.string().max(MAX_QUERY_LENGTH, `حداکثر ${MAX_QUERY_LENGTH} نویسه`),
  sort: z.enum(SORT_VALUES, { error: "مرتب‌سازی نامعتبر است" }),
  page: pageSchema,
  limit: limitSchema,
} satisfies Record<FilterField, z.ZodType>;

function canonicalDecimal(value: string): string {
  const [intPart, fraction = ""] = value.split(".");
  const int = intPart.replace(/^0+(?=\d)/, "");
  const frac = fraction.replace(/0+$/, "");
  return frac ? `${int}.${frac}` : int;
}

/** Exact million-toman decimal string to bigint toman. */
export function millionToToman(million: string): bigint {
  const [intPart, fraction = ""] = million.split(".");
  return BigInt(intPart) * 1_000_000n + BigInt(fraction.padEnd(6, "0").slice(0, 6) || "0");
}

export function parseFilters(raw: RawParams): ParseResult {
  const filters: Filters = { ...DEFAULT_FILTERS };
  const errors: FilterErrors = {};

  for (const field of PARAM_ORDER) {
    const value = LIST_FIELDS.has(field) ? readList(raw, field) : read(raw, field);
    if (value === undefined) continue;
    const result = fieldSchemas[field].safeParse(value);
    if (result.success) {
      (filters as Record<string, unknown>)[field] = result.data;
    } else {
      errors[field] = result.error.issues[0]?.message ?? "مقدار نامعتبر است";
    }
  }

  if (filters.min && filters.max && millionToToman(filters.min) > millionToToman(filters.max)) {
    errors.max = "حداکثر قیمت باید از حداقل بیشتر باشد";
  }
  if (filters.yearMin && filters.yearMax && filters.yearMin > filters.yearMax) {
    errors.yearMax = "سال پایان باید بعد از سال شروع باشد";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors, filters };
  return { ok: true, filters };
}

export function serializeFilters(filters: Partial<Filters>): URLSearchParams {
  const params = new URLSearchParams();
  for (const field of PARAM_ORDER) {
    const value = filters[field];
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(field, value.join(","));
      continue;
    }
    if (field === "sort" && value === DEFAULT_SORT) continue;
    if (field === "page" && value === 1) continue;
    if (field === "limit" && value === DEFAULT_LIMIT) continue;
    params.set(field, String(value));
  }
  return params;
}

export function filtersHref(filters: Partial<Filters>, pathname = "/cars"): string {
  const query = serializeFilters(filters).toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Filter dimensions only: what identifies a result set independent of paging. */
export function queryKey(filters: Filters): string {
  return serializeFilters({ ...filters, page: 1, limit: DEFAULT_LIMIT }).toString();
}

export function hasActiveFilters(filters: Filters): boolean {
  return Boolean(
    filters.brand?.length ||
      filters.min ||
      filters.max ||
      filters.yearMin ||
      filters.yearMax ||
      filters.condition?.length ||
      filters.payment?.length ||
      filters.q,
  );
}

export function activeFilterCount(filters: Filters): number {
  let count = 0;
  if (filters.brand?.length) count++;
  if (filters.min || filters.max) count++;
  if (filters.yearMin || filters.yearMax) count++;
  if (filters.condition?.length) count++;
  if (filters.payment?.length) count++;
  return count;
}

/** Adds the value if absent, removes it if present; returns undefined for an empty list. */
export function toggleValue<T extends string>(list: T[] | undefined, value: T): T[] | undefined {
  const next = list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value];
  return next.length > 0 ? next : undefined;
}

export type PageInfo = { total: number; page: number; limit: number; hasNext: boolean; pageCount: number };

export function pageInfo(total: number, page: number, limit: number): PageInfo {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, hasNext: page * limit < total, pageCount };
}

/** Returns the page to redirect to when the requested page is past the end, otherwise null. */
export function clampPage(total: number, page: number, limit: number): number | null {
  if (total === 0) return page === 1 ? null : 1;
  const last = Math.ceil(total / limit);
  return page > last ? last : null;
}
