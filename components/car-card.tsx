import Image from "next/image";
import Link from "next/link";
import type { CarSummary } from "@/lib/types";
import { formatKm, formatMillionToman, formatYear } from "@/lib/format";
import { TRANSMISSION_LABELS } from "@/lib/labels";
import { ConditionBadge, PaymentBadges } from "./badges";
import { CompareToggle } from "./compare-toggle";

export function CarCard({ car, priority = false }: { car: CarSummary; priority?: boolean }) {
  const meta = [car.colorLabelFa, car.transmission ? TRANSMISSION_LABELS[car.transmission] : null, car.cityFa].filter(Boolean);

  return (
    <article className="card group relative flex h-full flex-col gap-3 p-4 transition-shadow duration-200 hover:shadow-lg hover:shadow-ink/5 md:p-5">
      <div className="flex items-center justify-between text-sm">
        <p className="font-bold">
          <span className="sr-only">کارکرد: </span>
          <bdi dir="ltr">{formatKm(car.mileageKm)} KM</bdi>
        </p>
        <p className="text-muted">
          <span className="sr-only">سال ساخت: </span>
          {formatYear(car.productionYearJalali)} <span aria-hidden="true">ساخت</span>
        </p>
      </div>

      <div className="relative -mx-2 aspect-[16/10] overflow-hidden">
        {car.mainImage ? (
          <Image
            src={car.mainImage.src}
            alt={car.mainImage.alt}
            fill
            sizes="(min-width: 1200px) 30vw, (min-width: 768px) 45vw, 92vw"
            priority={priority}
            className="scale-[1.12] object-cover transition-transform duration-300 ease-out-soft group-hover:scale-[1.16]"
          />
        ) : (
          <div className="grid h-full place-items-center rounded-button bg-chip text-sm text-muted">بدون تصویر</div>
        )}
      </div>

      <div>
        <ConditionBadge condition={car.condition} />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-black">
          <Link href={`/cars/${car.slug}`} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none">
            {car.titleFa}
          </Link>
        </h3>
        <p className="flex flex-wrap gap-x-2 text-sm text-muted">
          {meta.map((m, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">•</span>}
              {m}
            </span>
          ))}
        </p>
      </div>

      <p className="text-xl font-black">
        {formatMillionToman(car.priceToman)} <span className="text-base font-bold">میلیون تومان</span>
      </p>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 pt-1">
        <PaymentBadges methods={car.paymentMethods} />
        <CompareToggle carId={car.id} title={car.titleFa} />
      </div>
    </article>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="card flex flex-col gap-4 p-5" aria-hidden="true">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-4 w-14 rounded" />
      </div>
      <div className="skeleton aspect-[16/10] rounded-button" />
      <div className="skeleton h-6 w-20 rounded-full" />
      <div className="skeleton h-6 w-40 rounded" />
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-6 w-36 rounded" />
    </div>
  );
}
