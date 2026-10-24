"use client";

import Link from "next/link";
import { useCompareIds } from "./compare-store";
import { CompareIcon } from "./icons";
import { faDigits } from "@/lib/format";

export function CompareEmpty({ message, suggestedIds }: { message: string; suggestedIds: string[] }) {
  const stored = useCompareIds();
  const resumable = stored.length >= 2 && stored.join(",") !== suggestedIds.join(",");

  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-mint text-green">
        <CompareIcon size={26} />
      </span>
      <p className="text-lg font-bold">{message}</p>
      <p className="max-w-sm text-sm text-muted">از فهرست خودروها، گزینه «مقایسه» را روی دو خودرو فعال کنید.</p>
      <div className="flex flex-wrap justify-center gap-3">
        {resumable && (
          <Link href={`/compare?ids=${stored.join(",")}`} className="pill-solid">
            مقایسه {faDigits(stored.length)} خودروی انتخاب‌شده
          </Link>
        )}
        <Link href="/cars" className={resumable ? "pill-ghost" : "pill-solid"}>
          انتخاب خودرو
        </Link>
      </div>
    </div>
  );
}
