import { MAX_COMPARE_IDS, MIN_COMPARE_IDS } from "./compare-limits";
import { displayValue, featureRows, rowDiffers, SPEC_GROUP_LABELS, SPEC_ROWS, type SpecGroup } from "./specs";
import type { CarDetail } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CompareIdsResult =
  | { ok: true; ids: string[] }
  | { ok: false; reason: "missing" | "too_few" | "too_many" | "invalid" | "duplicate"; ids: string[] };

export function parseCompareIds(raw: string | string[] | undefined): CompareIdsResult {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.trim()) return { ok: false, reason: "missing", ids: [] };
  if (value.length > 200) return { ok: false, reason: "too_many", ids: [] };
  const parts = value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (parts.some((p) => !UUID.test(p))) return { ok: false, reason: "invalid", ids: [] };
  const unique = [...new Set(parts)];
  if (unique.length !== parts.length) return { ok: false, reason: "duplicate", ids: unique.slice(0, MAX_COMPARE_IDS) };
  if (unique.length > MAX_COMPARE_IDS) return { ok: false, reason: "too_many", ids: unique.slice(0, MAX_COMPARE_IDS) };
  if (unique.length < MIN_COMPARE_IDS) return { ok: false, reason: "too_few", ids: unique };
  return { ok: true, ids: unique };
}

export type CompareRow = {
  key: string;
  label: string;
  unit?: string;
  unitLtr?: boolean;
  group: SpecGroup;
  groupLabel: string;
  values: string[];
  unknown: boolean[];
  differs: boolean;
};

export function buildCompareRows(cars: CarDetail[]): CompareRow[] {
  return [...SPEC_ROWS, ...featureRows(cars)].map((row) => {
    const values = cars.map((c) => displayValue(row, c));
    return {
      key: row.key,
      label: row.label,
      unit: row.unit,
      unitLtr: row.unitLtr,
      group: row.group,
      groupLabel: SPEC_GROUP_LABELS[row.group],
      values,
      unknown: cars.map((c) => row.value(c) == null),
      differs: rowDiffers(row, cars),
    };
  });
}
