"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * GSAP owns only the direct `[data-reveal-item]` children of this list.
 * Items already in the viewport on mount are left untouched so server-rendered content never flashes.
 */
export function RevealList({ children, className, itemKeys }: { children: ReactNode; className?: string; itemKeys: string[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const seen = useRef(new Set<string>());

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const fresh = gsap.utils
          .toArray<HTMLElement>(root.querySelectorAll(":scope > [data-reveal-item]"))
          .filter((el, i) => {
            const key = itemKeys[i];
            if (!key || seen.current.has(key)) return false;
            seen.current.add(key);
            return el.getBoundingClientRect().top > window.innerHeight;
          });
        if (fresh.length === 0) return;
        gsap.set(fresh, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(fresh, {
          start: "top 92%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.07, overwrite: true }),
        });
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [itemKeys.join(",")], revertOnUpdate: false },
  );

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
