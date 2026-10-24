import { describe, expect, it } from "vitest";
import {
  clampPage,
  filtersHref,
  millionToToman,
  pageInfo,
  parseFilters,
  queryKey,
  serializeFilters,
  toggleValue,
  type Filters,
} from "@/lib/filters";

function ok(input: Record<string, string>): Filters {
  const result = parseFilters(input);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.filters;
}

describe("parseFilters", () => {
  it("applies defaults", () => {
    expect(ok({})).toEqual({ sort: "newest", page: 1, limit: 10 });
  });

  it("parses the populated contract example", () => {
    const params = new URLSearchParams(
      "brand=بی‌ام‌و&min=3000&max=9000&yearMin=1398&yearMax=1403&sort=price_asc&page=1&limit=10",
    );
    const result = parseFilters(params);
    expect(result.ok).toBe(true);
    expect(result.filters).toMatchObject({ brand: ["بی‌ام‌و"], min: "3000", max: "9000", yearMin: 1398, yearMax: 1403, sort: "price_asc" });
  });

  it("accepts Persian and Arabic-Indic digits", () => {
    expect(ok({ min: "۳۰۰۰", max: "٩٠٠٠", yearMin: "۱۳۹۸" })).toMatchObject({ min: "3000", max: "9000", yearMin: 1398 });
  });

  it("canonicalizes decimals", () => {
    expect(ok({ min: "0012.500" }).min).toBe("12.5");
  });

  it("rejects unknown sort and enum values", () => {
    const result = parseFilters({ sort: "price; DROP TABLE cars", condition: "shiny", payment: "crypto" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["condition", "payment", "sort"]);
  });

  it("rejects negative, malformed and reversed ranges", () => {
    expect(parseFilters({ min: "-1" }).ok).toBe(false);
    expect(parseFilters({ min: "1.1234567" }).ok).toBe(false);
    expect(parseFilters({ min: "9000", max: "3000" }).ok).toBe(false);
    expect(parseFilters({ yearMin: "1403", yearMax: "1398" }).ok).toBe(false);
    expect(parseFilters({ yearMin: "2024" }).ok).toBe(false);
  });

  it("allows only 10, 20 and 50 as limit", () => {
    expect(ok({ limit: "20" }).limit).toBe(20);
    expect(parseFilters({ limit: "25" }).ok).toBe(false);
    expect(parseFilters({ page: "0" }).ok).toBe(false);
  });

  it("bounds the search string", () => {
    expect(parseFilters({ q: "x".repeat(100) }).ok).toBe(true);
    expect(parseFilters({ q: "x".repeat(101) }).ok).toBe(false);
  });

  it("normalizes Arabic yeh/kaf and whitespace in text", () => {
    expect(ok({ brand: "  كيا  " }).brand).toEqual(["کیا"]);
  });

  it("accepts multiple values as commas or repeated params, deduped", () => {
    expect(ok({ brand: "کیا,پژو، کیا" }).brand).toEqual(["کیا", "پژو"]);
    const repeated = parseFilters(new URLSearchParams("payment=trade_in&payment=cash&condition=repainted,original_paint"));
    expect(repeated.ok && repeated.filters.payment).toEqual(["cash", "trade_in"]);
    expect(repeated.ok && repeated.filters.condition).toEqual(["original_paint", "repainted"]);
  });

  it("rejects a list when any value is invalid", () => {
    const result = parseFilters({ payment: "cash,crypto" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["payment"]);
  });
});

describe("toggleValue", () => {
  it("adds, removes and empties to undefined", () => {
    expect(toggleValue(undefined, "a")).toEqual(["a"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleValue(["a"], "a")).toBeUndefined();
  });
});

describe("serializeFilters", () => {
  it("omits defaults and uses canonical order", () => {
    const filters = ok({ limit: "10", page: "1", sort: "newest", max: "900", brand: "پژو" });
    expect(serializeFilters(filters).toString()).toBe(new URLSearchParams("brand=پژو&max=900").toString());
  });

  it("round-trips", () => {
    const href = filtersHref(ok({ brand: "کیا,پژو", min: "1000", payment: "installment,trade_in", sort: "mileage_desc", page: "2", limit: "20" }));
    const reparsed = ok(Object.fromEntries(new URL(href, "https://x.test").searchParams));
    expect(filtersHref(reparsed)).toBe(href);
  });

  it("queryKey ignores paging", () => {
    expect(queryKey(ok({ brand: "کیا", page: "3", limit: "50" }))).toBe(queryKey(ok({ brand: "کیا" })));
  });
});

describe("millionToToman", () => {
  it("converts exactly by 1,000,000", () => {
    expect(millionToToman("900")).toBe(900_000_000n);
    expect(millionToToman("4950")).toBe(4_950_000_000n);
    expect(millionToToman("0.000001")).toBe(1n);
    expect(millionToToman("12.5")).toBe(12_500_000n);
  });
});

describe("pagination", () => {
  it("30 results: first 10, one append to 20, page 3 shows 21-30", () => {
    const first = pageInfo(30, 1, 10);
    expect(first.hasNext).toBe(true);
    const appended = pageInfo(30, 2, 10);
    expect(appended.hasNext).toBe(true);
    const third = pageInfo(30, 3, 10);
    expect(third.hasNext).toBe(false);
    expect((third.page - 1) * third.limit + 1).toBe(21);
    expect(third.pageCount).toBe(3);
  });

  it("fewer than 20 results never needs a third page", () => {
    expect(pageInfo(15, 2, 10).hasNext).toBe(false);
    expect(pageInfo(10, 1, 10).hasNext).toBe(false);
  });

  it("clamps pages past the end", () => {
    expect(clampPage(30, 9, 10)).toBe(3);
    expect(clampPage(30, 3, 10)).toBeNull();
    expect(clampPage(0, 1, 10)).toBeNull();
    expect(clampPage(0, 4, 10)).toBe(1);
  });
});
