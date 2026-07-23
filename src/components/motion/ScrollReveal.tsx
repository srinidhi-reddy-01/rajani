"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Reveals once as the element enters the viewport, rather than FadeIn's on-mount
// animation - for content further down the page than the initial viewport. Skips
// the animation entirely under prefers-reduced-motion, which doubles as a safety
// net against any renderer that never fires a real scroll/intersection event.
export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
