import { faDigits, formatMillionToman, formatPercentFromBps } from "@/lib/format";
import { PAYMENT_LABELS } from "@/lib/labels";
import type { PublicPaymentOption } from "@/lib/types";

export function PaymentOptions({ options }: { options: PublicPaymentOption[] }) {
  if (options.length === 0) return <p className="text-muted">روش پرداخت ثبت نشده است.</p>;

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {options.map((o) => (
        <li key={o.method} className="card flex flex-col gap-2 p-5">
          <p className="text-lg font-black">{PAYMENT_LABELS[o.method]}</p>
          {o.method === "cash" && <p className="text-sm text-muted">پرداخت کامل مبلغ هنگام تنظیم قرارداد.</p>}
          {o.method === "trade_in" && <p className="text-sm text-muted">ارزیابی خودروی شما در نمایشگاه انجام می‌شود.</p>}
          {o.method === "installment" && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">پیش‌پرداخت</dt>
              <dd className="font-bold">
                {o.downPaymentToman ? `${formatMillionToman(o.downPaymentToman)} میلیون تومان` : "با تماس"}
              </dd>
              <dt className="text-muted">مدت</dt>
              <dd className="font-bold">{o.termMonths ? `${faDigits(o.termMonths)} ماه` : "با تماس"}</dd>
              <dt className="text-muted">نرخ سالانه</dt>
              <dd className="font-bold">{o.annualRateBps != null ? formatPercentFromBps(o.annualRateBps) : "تماس برای شرایط"}</dd>
            </dl>
          )}
          {o.method === "installment" && o.annualRateBps == null && (
            <p className="text-xs text-muted">مبلغ اقساط ماهانه پس از اعلام نرخ توسط نمایشگاه مشخص می‌شود.</p>
          )}
          {o.termsFa && <p className="text-sm text-muted">{o.termsFa}</p>}
        </li>
      ))}
    </ul>
  );
}
