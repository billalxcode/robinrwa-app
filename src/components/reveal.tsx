"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Fade-up reveal on scroll into view. Respects the OS reduced-motion
// setting by rendering statically. Once-only so scrolling back never
// replays. Dok: /websites/motion_dev — whileInView + useInView options.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
