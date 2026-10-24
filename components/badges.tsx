import type { BodyCondition, CarStatus, FuelType, PaymentMethod } from "@/db/schema";
import { CONDITION_LABELS, CONDITION_TONE, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/labels";
import { BoltIcon } from "./icons";

const TONE_CLASS = {
  good: "bg-mint text-green",
  warn: "bg-warning text-warning-ink",
  bad: "bg-danger text-danger-ink",
  neutral: "bg-chip text-muted",
} as const;

const TONE_DOT = {
  good: "bg-green",
  warn: "bg-warning-ink",
  bad: "bg-danger-ink",
  neutral: "bg-muted",
} as const;

export function ConditionBadge({ condition, className = "" }: { condition: BodyCondition; className?: string }) {
  const tone = CONDITION_TONE[condition];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASS[tone]} ${className}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${TONE_DOT[tone]}`} />
      <span className="sr-only">وضعیت بدنه: </span>
      {CONDITION_LABELS[condition]}
    </span>
  );
}

export function EvBadge({ fuelType, className = "" }: { fuelType: FuelType | null; className?: string }) {
  if (fuelType !== "electric") return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-ev px-2.5 py-1 text-xs font-bold text-ev-ink ${className}`}>
      <BoltIcon size={13} />
      <bdi dir="ltr" aria-hidden="true">
        EV
      </bdi>
      <span className="sr-only">خودروی برقی</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: CarStatus }) {
  const tone = status === "available" ? "border-green/30 text-green" : "border-warning-ink/30 text-warning-ink";
  return (
    <span className={`inline-flex items-center rounded-full border bg-surface px-3 py-1 text-xs font-medium ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentBadges({ methods, size = "sm" }: { methods: PaymentMethod[]; size?: "sm" | "md" }) {
  if (methods.length === 0) return null;
  return (
    <ul aria-label="روش‌های پرداخت" className="flex min-w-0 flex-wrap gap-1.5">
      {methods.map((m) => (
        <li
          key={m}
          className={`rounded-full bg-chip text-ink/80 ${size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"}`}
        >
          {PAYMENT_LABELS[m]}
        </li>
      ))}
    </ul>
  );
}
