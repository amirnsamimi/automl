"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

/**
 * Nonessential hero motion driven by GSAP. Only `[data-hero-accent]` and `[data-hero-float]`
 * descendants are animated, with transforms only, so text is readable before hydration.
 */
export function HeroIntro({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-accent]", { scaleX: 0, transformOrigin: "100% 50%", duration: 0.7 })
          .from("[data-hero-float]", { y: 18, scale: 0.98, duration: 0.8 }, 0.05);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
