import type { CarDetail } from "./types";
import {
  BODY_TYPE_LABELS,
  CONDITION_LABELS,
  DRIVETRAIN_LABELS,
  FUEL_LABELS,
  PAYMENT_LABELS,
  STATUS_LABELS,
  TRANSMISSION_LABELS,
} from "./labels";
import { faDecimal, faInt, formatKm, formatMillionToman, formatYear, UNKNOWN_FA } from "./format";

export type SpecGroup = "overview" | "technical" | "dimensions" | "features" | "sale";

export type SpecRow = {
  key: string;
  label: string;
  unit?: string;
  /** Unit rendered left-to-right (e.g. KM). */
  unitLtr?: boolean;
  group: SpecGroup;
  /** Raw comparable value; null means not recorded. */
  value: (car: CarDetail) => string | number | null;
  format?: (value: string | number) => string;
};

export const SPEC_GROUP_LABELS: Record<SpecGroup, string> = {
  overview: "خلاصه",
  technical: "مشخصات فنی",
  dimensions: "ابعاد",
  features: "امکانات",
  sale: "شرایط فروش",
};

const int = (v: string | number) => faInt(Number(v));

export const SPEC_ROWS: SpecRow[] = [
  { key: "price", label: "قیمت", unit: "میلیون تومان", group: "overview", value: (c) => c.priceToman, format: (v) => formatMillionToman(String(v)) },
  { key: "year", label: "سال ساخت", unit: "شمسی", group: "overview", value: (c) => c.productionYearJalali, format: (v) => formatYear(Number(v)) },
  { key: "mileage", label: "کارکرد", unit: "KM", unitLtr: true, group: "overview", value: (c) => c.mileageKm, format: (v) => formatKm(Number(v)) },
  { key: "color", label: "رنگ", group: "overview", value: (c) => c.colorLabelFa },
  { key: "condition", label: "وضعیت بدنه", group: "overview", value: (c) => CONDITION_LABELS[c.condition] },
  { key: "city", label: "شهر", group: "overview", value: (c) => c.cityFa },
  { key: "status", label: "وضعیت", group: "overview", value: (c) => STATUS_LABELS[c.status] },

  { key: "bodyType", label: "نوع بدنه", group: "technical", value: (c) => (c.specs ? BODY_TYPE_LABELS[c.specs.bodyType] : null) },
  { key: "fuel", label: "سوخت", group: "technical", value: (c) => (c.specs ? FUEL_LABELS[c.specs.fuelType] : null) },
  { key: "transmission", label: "گیربکس", group: "technical", value: (c) => (c.specs ? TRANSMISSION_LABELS[c.specs.transmission] : null) },
  { key: "drivetrain", label: "دیفرانسیل", group: "technical", value: (c) => (c.specs ? DRIVETRAIN_LABELS[c.specs.drivetrain] : null) },
  { key: "engine", label: "حجم موتور", unit: "سی‌سی", group: "technical", value: (c) => c.specs?.engineCc ?? null, format: int },
  { key: "power", label: "قدرت", unit: "اسب بخار", group: "technical", value: (c) => c.specs?.powerHp ?? null, format: int },
  { key: "torque", label: "گشتاور", unit: "نیوتن‌متر", group: "technical", value: (c) => c.specs?.torqueNm ?? null, format: int },
  { key: "battery", label: "ظرفیت باتری", unit: "kWh", unitLtr: true, group: "technical", value: (c) => c.specs?.batteryKwh ?? null, format: (v) => faDecimal(String(v)) },
  { key: "range", label: "برد", unit: "کیلومتر", group: "technical", value: (c) => c.specs?.rangeKm ?? null, format: int },
  { key: "seats", label: "ظرفیت", unit: "نفر", group: "technical", value: (c) => c.specs?.seats ?? null, format: int },

  { key: "length", label: "طول", unit: "میلی‌متر", group: "dimensions", value: (c) => c.specs?.lengthMm ?? null, format: int },
  { key: "width", label: "عرض", unit: "میلی‌متر", group: "dimensions", value: (c) => c.specs?.widthMm ?? null, format: int },
  { key: "height", label: "ارتفاع", unit: "میلی‌متر", group: "dimensions", value: (c) => c.specs?.heightMm ?? null, format: int },

  {
    key: "payments",
    label: "روش پرداخت",
    group: "sale",
    value: (c) => (c.paymentOptions.length ? c.paymentOptions.map((p) => PAYMENT_LABELS[p.method]).join("، ") : null),
  },
  { key: "listingCode", label: "کد موجودی", group: "sale", value: (c) => c.listingCode },
];

export function featureRows(cars: CarDetail[]): SpecRow[] {
  const codes = new Map<string, string>();
  for (const car of cars) for (const f of car.features) codes.set(f.code, f.labelFa);
  return [...codes].map(([code, label]) => ({
    key: `feature:${code}`,
    label,
    group: "features" as const,
    value: (c: CarDetail) => {
      const feature = c.features.find((f) => f.code === code);
      if (!feature || feature.availability === "unknown") return null;
      return feature.availability === "present" ? "دارد" : "ندارد";
    },
  }));
}

export function displayValue(row: SpecRow, car: CarDetail): string {
  const value = row.value(car);
  if (value === null || value === undefined || value === "") return UNKNOWN_FA;
  return row.format ? row.format(value) : String(value);
}

export function rowDiffers(row: SpecRow, cars: CarDetail[]): boolean {
  const values = cars.map((c) => row.value(c));
  return values.some((v) => String(v) !== String(values[0]));
}
