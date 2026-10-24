import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCompareIds } from "@/lib/compare";
import { formatKm, formatMillionToman, matchKey, normalizeDigits } from "@/lib/format";
import { publicAssetPath } from "@/lib/images";

const A = "2c3feb6e-fd6b-5836-9951-ddc1d674821c";
const B = "59171696-ea43-5a36-8207-6bc0c43e013f";
const C = "91903f7a-4251-5e73-ac38-e345f9cb764a";
const D = "6dd0fd11-385d-5f1b-8cf6-e0a905b6ded6";

describe("format", () => {
  it("renders million toman with Persian digits", () => {
    expect(formatMillionToman("4950000000")).toBe("۴٬۹۵۰");
    expect(formatMillionToman("12500000000")).toBe("۱۲٬۵۰۰");
    expect(formatMillionToman("1250000")).toBe("۱٫۲۵");
  });

  it("renders mileage digits", () => {
    expect(formatKm(42000)).toBe("۴۲٬۰۰۰");
  });

  it("normalizes digits for parsing", () => {
    expect(normalizeDigits("۱۴۰۳٫۵")).toBe("1403.5");
  });

  it("matches brand aliases regardless of ZWNJ and spacing", () => {
    expect(matchKey("بی ام و")).toBe(matchKey("بی‌ام‌و"));
    expect(matchKey("Mercedes Benz")).toBe(matchKey("mercedes-benz"));
  });

  it("maps seed asset paths to public webp files", () => {
    expect(publicAssetPath("selected/bmw-3-series/main.png")).toEqual({ src: "/cars/bmw-3-series/main.webp", size: 1000 });
    expect(() => publicAssetPath("../../etc/passwd")).toThrow();
  });
});

describe("parseCompareIds", () => {
  it("accepts 2-3 distinct UUIDs", () => {
    expect(parseCompareIds(`${A},${B}`)).toEqual({ ok: true, ids: [A, B] });
    expect(parseCompareIds(`${A},${B},${C}`).ok).toBe(true);
  });

  it("rejects too few, too many, duplicates and malformed ids", () => {
    expect(parseCompareIds(A)).toMatchObject({ ok: false, reason: "too_few" });
    expect(parseCompareIds(`${A},${B},${C},${D}`)).toMatchObject({ ok: false, reason: "too_many" });
    expect(parseCompareIds(`${A},${A}`)).toMatchObject({ ok: false, reason: "duplicate" });
    expect(parseCompareIds(`${A},1 OR 1=1`)).toMatchObject({ ok: false, reason: "invalid" });
    expect(parseCompareIds(undefined)).toMatchObject({ ok: false, reason: "missing" });
  });
});

describe("public projection", () => {
  const source = readFileSync(path.resolve(__dirname, "../lib/db/queries.ts"), "utf8");

  it("never selects owner columns or the owners table", () => {
    expect(source).not.toMatch(/ownerId|owners\b|legalName|\.email|\.phone/);
  });

  it("public types expose no owner fields", () => {
    const types = readFileSync(path.resolve(__dirname, "../lib/types.ts"), "utf8");
    expect(types).not.toMatch(/owner|legal|email|phone/i);
  });
});
