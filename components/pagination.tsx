"use client";

import { faDigits } from "@/lib/format";
import { LIMIT_VALUES, type Limit } from "@/lib/filters";
import { BackIcon, NextIcon } from "./icons";

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  onPage: (page: number) => void;
  onLimit: (limit: Limit) => void;
  hrefFor: (page: number) => string;
};

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, limit, total, onPage, onLimit, hrefFor }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const hasNext = page < pageCount;

  const link = (p: number, children: React.ReactNode, props: React.AnchorHTMLAttributes<HTMLAnchorElement> = {}) => (
    <a
      href={hrefFor(p)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onPage(p);
      }}
      {...props}
    >
      {children}
    </a>
  );

  return (
    <nav aria-label="صفحه‌بندی" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="pill-ghost relative cursor-pointer">
          <span>تعداد در صفحه:</span>
          <select
            className="cursor-pointer appearance-none bg-transparent font-bold focus:outline-none"
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value) as Limit)}
          >
            {LIMIT_VALUES.map((l) => (
              <option key={l} value={l}>
                {faDigits(l)}
              </option>
            ))}
          </select>
        </label>

        <ol className="flex items-center gap-2">
          {pageWindow(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
                …
              </li>
            ) : (
              <li key={p}>
                {link(p, faDigits(p), {
                  "aria-current": p === page ? "page" : undefined,
                  "aria-label": `صفحه ${faDigits(p)}`,
                  className:
                    "tap grid size-12 place-items-center rounded-full border border-border bg-surface font-bold aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-surface",
                })}
              </li>
            ),
          )}
        </ol>
      </div>

      <div className="flex items-center justify-between">
        {page > 1 ? (
          link(page - 1, <><BackIcon size={18} /> صفحه قبل</>, { className: "tap inline-flex items-center gap-2 font-bold text-green", rel: "prev" })
        ) : (
          <span />
        )}
        {hasNext &&
          link(page + 1, <>صفحه بعد <NextIcon size={18} /></>, { className: "tap inline-flex items-center gap-2 font-bold text-green", rel: "next" })}
      </div>
    </nav>
  );
}
