"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { clearCompare, MAX_COMPARE, useCompareIds } from "./compare-store";
import { faDigits } from "@/lib/format";

export function CompareTray() {
  const ids = useCompareIds();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {ids.length > 0 && (
        <motion.div
          initial={reduce ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-4 bottom-20 z-30 mx-auto max-w-md lg:bottom-6"
        >
          <div role="region" aria-label="مقایسه" className="flex items-center gap-3 rounded-full bg-ink p-2 ps-5 text-surface shadow-xl shadow-ink/20">
            <p className="flex-1 text-sm" aria-live="polite">
              {faDigits(ids.length)} از {faDigits(MAX_COMPARE)} خودرو برای مقایسه
            </p>
            <button type="button" onClick={clearCompare} className="tap rounded-full px-3 text-sm text-surface/70 hover:text-surface">
              پاک کردن
            </button>
            {ids.length >= 2 ? (
              <Link href={`/compare?ids=${ids.join(",")}`} className="tap inline-flex items-center rounded-full bg-mint px-5 text-sm font-bold text-ink">
                مقایسه
              </Link>
            ) : (
              <span className="tap inline-flex items-center rounded-full bg-surface/10 px-4 text-xs text-surface/80">
                یک خودروی دیگر انتخاب کنید
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
