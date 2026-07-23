"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// A quiet card at rest, livelier on hover/tap: lift, icon inverts to a solid dark
// fill and gives a small playful turn, and a rule grows under the title. Neutral
// throughout - no per-card accent color, hierarchy comes from size/weight/motion,
// not hue. Tap feedback (whileTap) covers touch devices where hover never fires.
export function WorryCard({ title, body, icon }: { title: string; body: string; icon: ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="group flex h-full flex-col items-start gap-4 rounded-3xl border border-border bg-surface p-8 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
    >
      <motion.span
        whileHover={{ rotate: 10, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 320, damping: 14 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ivory text-ink transition-colors duration-300 group-hover:bg-charcoal-900 group-hover:text-cream-50"
      >
        {icon}
      </motion.span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl font-semibold tracking-tight text-charcoal-900">{title}</h3>
        <span className="block h-0.5 w-8 rounded-full bg-charcoal-900 transition-all duration-300 group-hover:w-16" />
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
    </motion.div>
  );
}
