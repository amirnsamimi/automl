"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { CompareRow } from "@/lib/compare";
import { faDigits, formatYear } from "@/lib/format";
import { MAX_COMPARE, setCompareIds } from "./compare-store";
import { CloseIcon } from "./icons";

gsap.registerPlugin(useGSAP);

export type CompareCarHeader = {
  id: string;
  slug: string;
  title: string;
  year: number;
  color: string;
  status: string;
  available: boolean;
  image: { src: string; alt: string } | null;
};

export function CompareTable({ cars, rows }: { cars: CompareCarHeader[]; rows: CompareRow[] }) {
  const [diffOnly, setDiffOnly] = useState(false);
  const router = useRouter();
  const toggleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const ids = cars.map((c) => c.id);

  useEffect(() => {
    setCompareIds(ids);
    // Keep the local selection in sync with the shared URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-compare-col]", { y: 16, duration: 0.5, ease: "power2.out", stagger: 0.08 });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  const visible = diffOnly ? rows.filter((r) => r.differs) : rows;
  const groups = [...new Set(visible.map((r) => r.groupLabel))];
  const cols = cars.length;

  const remove = (id: string) => {
    const next = ids.filter((x) => x !== id);
    setCompareIds(next);
    router.push(next.length ? `/compare?ids=${next.join(",")}` : "/compare");
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-card bg-mint px-5 py-4">
        <label htmlFor={toggleId} className="font-bold">
          فقط تفاوت‌ها
        </label>
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={diffOnly}
          onClick={() => setDiffOnly((v) => !v)}
          className="tap relative inline-flex h-8 w-14 min-w-14 items-center rounded-full bg-muted/40 p-1 transition-colors aria-checked:bg-green"
        >
          <span className="sr-only">{diffOnly ? "روشن" : "خاموش"}</span>
          <span
            aria-hidden="true"
            className={`size-6 rounded-full bg-surface shadow transition-transform duration-[160ms] ${diffOnly ? "-translate-x-6" : "translate-x-0"}`}
          />
        </button>
      </div>

      <div className="relative">
        <div className="overflow-x-auto overscroll-x-contain pb-2" tabIndex={0} role="region" aria-label="جدول مقایسه، برای دیدن ستون‌ها افقی پیمایش کنید">
          <table className={`w-full border-separate border-spacing-x-3 border-spacing-y-0 ${cols === 3 ? "min-w-[540px] md:min-w-0" : ""}`}>
            <caption className="sr-only">مقایسه {faDigits(cols)} خودرو</caption>
            <thead className="sticky top-0 z-10">
              <tr>
                <th scope="col" className="sr-only">
                  ویژگی
                </th>
                {cars.map((car) => (
                  <th key={car.id} scope="col" data-compare-col className="w-1/3 bg-canvas pb-3 align-top font-normal">
                    <div className="card relative flex flex-col gap-2 p-3 text-start">
                      <button
                        type="button"
                        onClick={() => remove(car.id)}
                        className="tap absolute end-1 top-1 z-10 grid place-items-center rounded-full text-muted hover:bg-chip hover:text-ink"
                        aria-label={`حذف ${car.title} از مقایسه`}
                      >
                        <CloseIcon size={18} />
                      </button>
                      <div className="relative aspect-[16/10]">
                        {car.image && <Image src={car.image.src} alt={car.image.alt} fill sizes="(min-width: 768px) 25vw, 45vw" className="scale-[1.12] object-cover" />}
                      </div>
                      <Link href={`/cars/${car.slug}`} className="font-black hover:underline">
                        {car.title}
                      </Link>
                      <p className="meta">
                        {formatYear(car.year)} · {car.color}
                      </p>
                      {!car.available && <p className="rounded-full bg-warning px-2 py-0.5 text-xs text-warning-ink">{car.status}</p>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group}>
                <tr>
                  <th colSpan={cols + 1} scope="colgroup" className="pb-2 pt-5 text-start text-lg font-black">
                    {group}
                  </th>
                </tr>
                {visible
                  .filter((r) => r.groupLabel === group)
                  .map((row) => (
                    <RowView key={row.key} row={row} />
                  ))}
              </tbody>
            ))}
          </table>
        </div>
        {cols === 3 && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-canvas to-transparent md:hidden" />
        )}
      </div>

      {visible.length === 0 && <p className="text-center text-muted">تفاوتی میان این خودروها ثبت نشده است.</p>}

      <p className="meta text-center">مشخصات نامشخص با «ثبت نشده» نمایش داده می‌شوند.</p>

      {cols < MAX_COMPARE && (
        <Link href="/cars" className="btn-primary w-full">
          افزودن خودروی {cols === 2 ? "سوم" : "دیگر"}
        </Link>
      )}
    </div>
  );
}

function RowView({ row }: { row: CompareRow }) {
  return (
    <>
      <tr>
        <th colSpan={row.values.length + 1} scope="rowgroup" className="sticky start-0 pb-1 pt-3 text-start text-sm font-normal text-muted">
          <span className="sticky start-0">
            {row.label}
            {row.unit && (
              <>
                {" · "}
                {row.unitLtr ? <bdi dir="ltr">{row.unit}</bdi> : row.unit}
              </>
            )}
          </span>
        </th>
      </tr>
      <tr>
        <th scope="row" className="sr-only">
          {row.label}
        </th>
        {row.values.map((v, i) => (
          <td
            key={i}
            className={`rounded-button px-3 py-3 text-center ${row.unknown[i] ? "bg-surface/60 text-sm text-muted" : "bg-surface font-black"} ${row.differs && !row.unknown[i] ? "ring-1 ring-green/30" : ""}`}
          >
            {v}
          </td>
        ))}
      </tr>
    </>
  );
}
