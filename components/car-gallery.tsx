"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { faDigits } from "@/lib/format";
import type { PublicImage } from "@/lib/types";

export function CarGallery({ images, title }: { images: PublicImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const current = images[index];

  if (!current) {
    return <div className="grid aspect-[4/3] place-items-center rounded-card bg-chip text-muted">بدون تصویر</div>;
  }

  const contain = current.role === "main";

  return (
    <div className="flex flex-col gap-3" role="region" aria-roledescription="گالری" aria-label={`تصاویر ${title}`}>
      <div className={`relative aspect-[4/3] overflow-hidden rounded-card lg:aspect-[3/2] ${contain ? "bg-surface" : "bg-ink"}`}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={current.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              priority={index === 0}
              sizes="(min-width: 1200px) 60vw, 100vw"
              className={contain ? "scale-110 object-cover" : "object-cover"}
            />
          </motion.div>
        </AnimatePresence>
        {current.isIllustrative && (
          <span className="absolute start-4 top-4 rounded-full bg-surface/90 px-4 py-1 text-xs text-ink">تصویر نمایشی</span>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-4 end-4 rounded-full bg-ink/85 px-3 py-1 text-sm text-surface" aria-live="polite">
            <span className="sr-only">تصویر </span>
            {faDigits(index + 1)}/{faDigits(images.length)}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-3" aria-label="انتخاب تصویر">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index ? "true" : undefined}
                aria-label={`نمایش تصویر ${faDigits(i + 1)}: ${img.alt}`}
                className="relative block h-20 w-28 overflow-hidden rounded-button border-2 border-border bg-surface transition-colors aria-[current=true]:border-green"
              >
                <Image src={img.src} alt="" fill sizes="112px" className={img.role === "main" ? "scale-110 object-cover" : "object-cover"} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
