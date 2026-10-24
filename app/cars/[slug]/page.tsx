import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConditionBadge, PaymentBadges, StatusBadge } from "@/components/badges";
import { CarGallery } from "@/components/car-gallery";
import { CompareButton } from "@/components/compare-toggle";
import { CompareTray } from "@/components/compare-tray";
import { BackIcon } from "@/components/icons";
import { HeroIntro } from "@/components/motion/hero-intro";
import { PaymentOptions } from "@/components/payment-options";
import { ShowroomCard, ShowroomContactButton } from "@/components/showroom-contact";
import { getCarBySlug, getPublishedSlugs } from "@/lib/db/queries";
import { formatJalaliDate, formatKm, formatMillionToman, formatYear } from "@/lib/format";
import { CONDITION_LABELS, STATUS_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { displayValue, featureRows, SPEC_GROUP_LABELS, SPEC_ROWS, type SpecGroup } from "@/lib/specs";
import type { CarDetail } from "@/lib/types";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return { title: "خودرو پیدا نشد" };
  return {
    title: `${car.titleFa} ${formatYear(car.productionYearJalali)}`,
    description: `${car.titleFa}، ${car.colorLabelFa}، کارکرد ${formatKm(car.mileageKm)} کیلومتر، ${formatMillionToman(car.priceToman)} میلیون تومان.`,
    openGraph: car.mainImage ? { images: [{ url: car.mainImage.src, width: car.mainImage.width, height: car.mainImage.height }] } : undefined,
  };
}

export default function CarPage({ params }: PageProps<"/cars/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <CarDetailView params={params} />
    </Suspense>
  );
}

async function CarDetailView({ params }: Pick<PageProps<"/cars/[slug]">, "params">) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const facts = [
    { label: "سال ساخت", value: formatYear(car.productionYearJalali) },
    { label: "کارکرد", value: <bdi dir="ltr">{formatKm(car.mileageKm)} KM</bdi> },
    { label: "گیربکس", value: car.specs ? TRANSMISSION_LABELS[car.specs.transmission] : "ثبت نشده" },
    { label: "رنگ", value: car.colorLabelFa },
    { label: "وضعیت بدنه", value: CONDITION_LABELS[car.condition] },
  ];

  return (
    <article className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-40 pt-5 lg:gap-8 lg:px-8 lg:pb-12 lg:pt-8">
      <nav aria-label="مسیر" className="flex items-center gap-3 text-sm text-muted">
        <Link href="/cars" className="tap grid size-12 place-items-center rounded-full border border-border bg-surface text-ink lg:hidden" aria-label="بازگشت به خودروها">
          <BackIcon />
        </Link>
        <ol className="hidden items-center gap-2 lg:flex">
          <li>
            <Link href="/cars" className="hover:text-ink">
              خودروها
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/cars?brand=${encodeURIComponent(car.brandFa)}`} className="hover:text-ink">
              {car.brandFa}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {car.modelFa}
          </li>
        </ol>
        <span className="font-bold text-ink lg:hidden">جزئیات خودرو</span>
      </nav>

      <HeroIntro className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-3xl font-black lg:text-4xl">{car.titleFa}</h1>
            <bdi dir="ltr" className="shrink-0 text-sm text-muted">
              {car.listingCode}
            </bdi>
          </div>
          <div data-hero-float>
            <CarGallery images={car.images} title={car.titleFa} />
          </div>
          <div className="flex flex-wrap gap-2">
            <ConditionBadge condition={car.condition} />
            <StatusBadge status={car.status} />
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="card flex flex-col gap-4 p-6">
            <p className="text-3xl font-black">
              {formatMillionToman(car.priceToman)} <span className="text-xl">میلیون تومان</span>
            </p>
            <span data-hero-accent aria-hidden="true" className="block h-1 w-16 rounded-full bg-green" />
            <p className="text-sm text-muted">
              {car.colorLabelFa} · {car.cityFa} · {STATUS_LABELS[car.status]}
            </p>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-border">
              {facts.map((f) => (
                <div key={f.label} className="rounded-button bg-canvas p-4 lg:flex lg:items-center lg:justify-between lg:rounded-none lg:bg-transparent lg:px-0 lg:py-3">
                  <dt className="meta">{f.label}</dt>
                  <dd className="mt-1 text-lg font-black lg:mt-0 lg:text-base">{f.value}</dd>
                </div>
              ))}
            </dl>
            <PaymentBadges methods={car.paymentOptions.map((p) => p.method)} size="md" />
            <div className="hidden flex-col gap-3 lg:flex">
              <ShowroomContactButton listingCode={car.listingCode} className="w-full" />
              <CompareButton carId={car.id} />
            </div>
          </div>
          <ShowroomCard sellerName={car.publicSellerName} city={car.cityFa} />
        </aside>
      </HeroIntro>

      <DetailSections car={car} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <p className="mb-3 text-center text-2xl font-black">
          {formatMillionToman(car.priceToman)} <span className="text-lg">میلیون تومان</span>
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <ShowroomContactButton listingCode={car.listingCode} />
          <CompareButton carId={car.id} />
        </div>
      </div>
      <CompareTray />
    </article>
  );
}

function DetailSections({ car }: { car: CarDetail }) {
  const groups: SpecGroup[] = ["technical", "dimensions"];
  const features = featureRows([car]);

  return (
    <div className="flex flex-col gap-8 lg:max-w-[calc(100%-432px)]">
      <nav aria-label="بخش‌ها" className="no-scrollbar sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto bg-canvas/95 px-4 py-3 backdrop-blur lg:mx-0 lg:px-0">
        <a href="#specs" className="chip">مشخصات فنی</a>
        <a href="#condition" className="chip">وضعیت بدنه</a>
        <a href="#sale" className="chip">شرایط فروش</a>
      </nav>

      <section id="specs" aria-labelledby="specs-title" className="scroll-mt-20">
        <h2 id="specs-title" className="mb-4 text-2xl font-black">
          مشخصات فنی
        </h2>
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group} className="card p-5">
              <h3 className="mb-3 font-bold text-muted">{SPEC_GROUP_LABELS[group]}</h3>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {SPEC_ROWS.filter((r) => r.group === group).map((row) => (
                  <SpecItem key={row.key} label={row.label} unit={row.unit} unitLtr={row.unitLtr} value={displayValue(row, car)} />
                ))}
              </dl>
            </div>
          ))}
          {features.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-muted">{SPEC_GROUP_LABELS.features}</h3>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {features.map((row) => (
                  <SpecItem key={row.key} label={row.label} value={displayValue(row, car)} />
                ))}
              </dl>
            </div>
          )}
          {car.specs && !car.specs.verified && (
            <p className="meta">مشخصات این آگهی هنوز با مدارک رسمی تطبیق داده نشده است.</p>
          )}
        </div>
      </section>

      <section id="condition" aria-labelledby="condition-title" className="scroll-mt-20">
        <h2 id="condition-title" className="mb-4 text-2xl font-black">
          وضعیت بدنه
        </h2>
        <div className="card flex flex-col gap-3 p-5">
          <ConditionBadge condition={car.condition} className="self-start" />
          {car.conditionNoteFa && <p>{car.conditionNoteFa}</p>}
          <p className="meta">گزارش کارشناسی رسمی برای این آگهی ثبت نشده است؛ پیش از خرید بازدید حضوری انجام دهید.</p>
        </div>
      </section>

      <section id="sale" aria-labelledby="sale-title" className="scroll-mt-20">
        <h2 id="sale-title" className="mb-4 text-2xl font-black">
          شرایط فروش
        </h2>
        <PaymentOptions options={car.paymentOptions} />
      </section>

      <section aria-labelledby="desc-title">
        <h2 id="desc-title" className="mb-3 text-2xl font-black">
          توضیحات
        </h2>
        <p className="leading-8 text-ink/80">{car.descriptionFa}</p>
        {car.publishedAt && <p className="meta mt-3">تاریخ انتشار: {formatJalaliDate(car.publishedAt)}</p>}
        <p className="meta mt-1">اطلاعات و تصاویر این نسخه، نمونهٔ نمایشی هستند.</p>
      </section>
    </div>
  );
}

function SpecItem({ label, value, unit, unitLtr }: { label: string; value: string; unit?: string; unitLtr?: boolean }) {
  const unknown = value === "ثبت نشده";
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className={unknown ? "text-muted" : "font-bold"}>
        {value}
        {!unknown && unit && (unitLtr ? <bdi dir="ltr" className="ms-1 text-sm font-normal text-muted">{unit}</bdi> : <span className="ms-1 text-sm font-normal text-muted">{unit}</span>)}
      </dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-8 lg:px-8" aria-busy="true">
      <div className="skeleton h-10 w-64 rounded" />
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="skeleton aspect-[3/2] rounded-card" />
        <div className="skeleton h-96 rounded-card" />
      </div>
      <p className="sr-only" role="status">
        در حال بارگذاری جزئیات خودرو
      </p>
    </div>
  );
}
