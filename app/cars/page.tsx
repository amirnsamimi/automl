import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CarCardSkeleton } from "@/components/car-card";
import { InventoryView } from "@/components/inventory-view";
import { HeroIntro } from "@/components/motion/hero-intro";
import { getBrands, getInventoryCount, listCars, resolveBrands } from "@/lib/db/queries";
import { faDigits } from "@/lib/format";
import { clampPage, filtersHref, parseFilters } from "@/lib/filters";

export const metadata: Metadata = {
  title: "موجودی خودروها",
  description: "خودروهای کارکرده منتخب با فیلتر برند، قیمت، سال ساخت، وضعیت بدنه و روش پرداخت.",
};

export default function CarsPage({ searchParams }: PageProps<"/cars">) {
  return (
    <div className="flex flex-col gap-8 pt-6 lg:gap-10 lg:pt-10">
      <HeroIntro className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[1.75rem] font-black leading-snug lg:text-[2.5rem]">
              ماشین بعدی شما،
              <br className="lg:hidden" /> همین‌جاست.
            </h1>
            <span data-hero-accent aria-hidden="true" className="mt-3 block h-1.5 w-24 rounded-full bg-green" />
          </div>
          <Suspense fallback={<p className="text-sm text-muted">خودروهای منتخب برای انتخابی مطمئن</p>}>
            <InventoryCount />
          </Suspense>
        </div>
      </HeroIntro>

      <Suspense fallback={<InventorySkeleton />}>
        <Inventory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function InventoryCount() {
  const count = await getInventoryCount();
  return <p className="text-sm text-muted">{faDigits(count)} خودروی منتخب برای انتخابی مطمئن</p>;
}

async function Inventory({ searchParams }: Pick<PageProps<"/cars">, "searchParams">) {
  const raw = await searchParams;
  const parsed = parseFilters(raw);
  const brands = await getBrands();

  if (!parsed.ok) {
    const { filters, errors } = parsed;
    return <InventoryView filters={filters} brands={brands} result={null} errors={errors} canonicalHref={filtersHref(filters)} />;
  }

  const filters = { ...parsed.filters };
  if (filters.brand) {
    const { brands: matched, unknown } = await resolveBrands(filters.brand);
    filters.brand = [...matched.map((b) => b.nameFa), ...unknown];
  }

  const result = await listCars(filters);
  const target = clampPage(result.total, filters.page, filters.limit);
  if (target !== null) redirect(filtersHref({ ...filters, page: target }));

  return <InventoryView filters={filters} brands={brands} result={result} canonicalHref={filtersHref(filters)} />;
}

function InventorySkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 lg:grid-cols-[320px_1fr] lg:px-8" aria-busy="true">
      <div className="card hidden h-[480px] lg:block" />
      <div className="flex flex-col gap-5">
        <div className="skeleton h-14 rounded-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
        <p className="sr-only" role="status">
          در حال بارگذاری خودروها
        </p>
      </div>
    </div>
  );
}
