"use client";

import { MotionConfig, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

let hydrated = false;

/**
 * Framer owns this wrapper node only. The first document load renders without an
 * initial hidden state so server HTML stays visible; client navigations fade in.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const animateIn = hydrated;
  useEffect(() => {
    hydrated = true;
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={animateIn ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
