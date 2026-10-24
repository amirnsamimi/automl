"use client";

import { useState } from "react";
import { MAX_COMPARE, toggleCompare, useCompareIds } from "./compare-store";
import { CheckIcon } from "./icons";

export function CompareToggle({ carId, title }: { carId: string; title: string }) {
  const ids = useCompareIds();
  const [message, setMessage] = useState("");
  const checked = ids.includes(carId);

  return (
    <label className="tap relative inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={() => {
          const result = toggleCompare(carId);
          setMessage(result === "full" ? `حداکثر ${MAX_COMPARE.toLocaleString("fa-IR")} خودرو قابل مقایسه است` : "");
        }}
        aria-label={`افزودن ${title} به مقایسه`}
        aria-describedby={message ? `${carId}-compare-msg` : undefined}
      />
      <span className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-muted/60 text-surface transition-colors peer-checked:border-green peer-checked:bg-green peer-focus-visible:outline-3 peer-focus-visible:outline-green">
        {checked && <CheckIcon size={14} strokeWidth={3} />}
      </span>
      <span>مقایسه</span>
      {message && (
        <span id={`${carId}-compare-msg`} role="status" className="absolute -top-7 end-0 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs text-surface">
          {message}
        </span>
      )}
    </label>
  );
}

export function CompareButton({ carId }: { carId: string }) {
  const ids = useCompareIds();
  const checked = ids.includes(carId);
  const full = !checked && ids.length >= MAX_COMPARE;

  return (
    <button
      type="button"
      className="btn-secondary w-full"
      aria-pressed={checked}
      disabled={full}
      onClick={() => toggleCompare(carId)}
    >
      {checked ? "حذف از مقایسه" : full ? "سقف مقایسه تکمیل است" : "افزودن به مقایسه"}
    </button>
  );
}
