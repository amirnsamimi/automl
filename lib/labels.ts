import type {
  BodyCondition,
  BodyType,
  CarStatus,
  Drivetrain,
  FuelType,
  PaymentMethod,
  Transmission,
} from "@/db/schema";

export const BODY_CONDITIONS = [
  "original_paint",
  "repainted_panel",
  "repainted",
  "accident_damage",
  "unknown",
] as const satisfies readonly BodyCondition[];

export const PAYMENT_METHODS = ["cash", "installment", "trade_in"] as const satisfies readonly PaymentMethod[];

export const CONDITION_LABELS: Record<BodyCondition, string> = {
  original_paint: "بدون رنگ",
  repainted_panel: "رنگ‌شدگی جزئی",
  repainted: "رنگ‌شده",
  accident_damage: "تصادفی",
  unknown: "وضعیت بدنه ثبت نشده",
};

export const CONDITION_TONE: Record<BodyCondition, "good" | "warn" | "bad" | "neutral"> = {
  original_paint: "good",
  repainted_panel: "warn",
  repainted: "warn",
  accident_damage: "bad",
  unknown: "neutral",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "نقدی",
  installment: "اقساطی",
  trade_in: "معاوضه",
};

export const STATUS_LABELS: Record<CarStatus, string> = {
  available: "موجود",
  reserved: "رزرو شده",
  sold: "فروخته شده",
  archived: "بایگانی",
};

export const FUEL_LABELS: Record<FuelType, string> = {
  petrol: "بنزینی",
  diesel: "دیزلی",
  hybrid: "هیبریدی",
  plugin_hybrid: "هیبرید شارژی",
  electric: "برقی",
  other: "سایر",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manual: "دستی",
  automatic: "اتوماتیک",
  cvt: "CVT",
  dual_clutch: "دوکلاچه",
  single_speed: "تک‌سرعته",
  unknown: "ثبت نشده",
};

export const DRIVETRAIN_LABELS: Record<Drivetrain, string> = {
  fwd: "دیفرانسیل جلو",
  rwd: "دیفرانسیل عقب",
  awd: "چهارچرخ دائم",
  four_wd: "چهارچرخ",
  unknown: "ثبت نشده",
};

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  sedan: "سدان",
  hatchback: "هاچ‌بک",
  suv: "شاسی‌بلند",
  crossover: "کراس‌اوور",
  coupe: "کوپه",
  wagon: "استیشن",
  van: "ون",
  pickup: "وانت",
  other: "سایر",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "mileage_asc", label: "کم‌کارکردترین" },
  { value: "mileage_desc", label: "پرکارکردترین" },
] as const;
