import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompareEmpty } from "@/components/compare-empty";
import { CompareTable, type CompareCarHeader } from "@/components/compare-table";
import { AlertIcon } from "@/components/icons";
import { buildCompareRows, parseCompareIds, type CompareIdsResult } from "@/lib/compare";
import { MAX_COMPARE_IDS } from "@/lib/compare-limits";
import { getCarsByIds } from "@/lib/db/queries";
import { faDigits } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/labels";

export const metadata: Metadata = {
  title: "مقایسه خودروها",
  description: "مقایسه کنار هم قیمت، کارکرد و مشخصات فنی دو خودرو.",
};

const REASONS: Record<Exclude<CompareIdsResult, { ok: true }>["reason"], string> = {
  missing: "هنوز خودرویی برای مقایسه انتخاب نشده است.",
  too_few: "برای مقایسه دست‌کم دو خودرو لازم است.",
  too_many: `حداکثر ${faDigits(MAX_COMPARE_IDS)} خودرو را می‌توان مقایسه کرد.`,
  invalid: "شناسه خودروها در نشانی معتبر نیست.",
  duplicate: "یک خودرو بیش از یک بار انتخاب شده است.",
};

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 lg:px-8 lg:pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black lg:text-4xl">کنار هم، روشن‌تر انتخاب کنید.</h1>
      </header>
      <Suspense fallback={<div className="skeleton h-96 rounded-card" aria-busy="true" />}>
        <CompareContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CompareContent({ searchParams }: Pick<PageProps<"/compare">, "searchParams">) {
  const { ids: raw } = await searchParams;
  const parsed = parseCompareIds(raw);

  if (!parsed.ok) {
    return <CompareEmpty message={REASONS[parsed.reason]} suggestedIds={parsed.ids} />;
  }

  const { cars, missing } = await getCarsByIds(parsed.ids);
  const unavailable = cars.filter((c) => c.status !== "available");

  if (cars.length < 2) {
    return (
      <CompareEmpty
        message={
          missing.length > 0
            ? "برخی از خودروهای انتخابی دیگر در دسترس نیستند. برای مقایسه دست‌کم دو خودرو لازم است."
            : REASONS.too_few
        }
        suggestedIds={cars.map((c) => c.id)}
      />
    );
  }

  const headers: CompareCarHeader[] = cars.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.titleFa,
    year: c.productionYearJalali,
    color: c.colorLabelFa,
    status: STATUS_LABELS[c.status],
    available: c.status === "available",
    fuelType: c.fuelType,
    image: c.mainImage ? { src: c.mainImage.src, alt: c.mainImage.alt } : null,
  }));

  return (
    <>
      <p className="-mt-4 text-sm text-muted">
        {faDigits(cars.length)} خودرو از {faDigits(MAX_COMPARE_IDS)} جایگاه
      </p>
      {(missing.length > 0 || unavailable.length > 0) && (
        <div role="status" className="flex items-start gap-3 rounded-card bg-warning p-4 text-sm text-warning-ink">
          <AlertIcon className="shrink-0" />
          <div>
            {missing.length > 0 && <p>{faDigits(missing.length)} خودروی انتخابی پیدا نشد یا دیگر منتشر نمی‌شود و از مقایسه حذف شد.</p>}
            {unavailable.length > 0 && (
              <p>
                {unavailable.map((c) => `${c.titleFa} (${STATUS_LABELS[c.status]})`).join("، ")} در حال حاضر قابل خرید نیست.
              </p>
            )}
            <Link href="/cars" className="mt-1 inline-block font-bold underline">
              انتخاب خودروی دیگر
            </Link>
          </div>
        </div>
      )}
      <CompareTable cars={headers} rows={buildCompareRows(cars)} />
    </>
  );
}
