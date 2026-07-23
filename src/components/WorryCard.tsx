"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ACCENTS = {
  gold: {
    border: "hover:border-gold-500",
    badge: "bg-gold-100 text-gold-600 group-hover:bg-gold-500 group-hover:text-cream-50",
    underline: "bg-gold-500",
  },
  royal: {
    border: "hover:border-royal-600",
    badge: "bg-royal-50 text-royal-700 group-hover:bg-royal-600 group-hover:text-cream-50",
    underline: "bg-royal-600",
  },
  green: {
    border: "hover:border-green-600",
    badge: "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-cream-50",
    underline: "bg-green-600",
  },
} as const;

// A quiet card at rest, livelier on hover/tap: lift, icon flips to a solid accent
// fill and gives a small playful turn, and a rule grows under the title. Tap
// feedback (whileTap) covers touch devices where hover never fires.
export function WorryCard({
  title,
  body,
  icon,
  accent,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  accent: keyof typeof ACCENTS;
}) {
  const c = ACCENTS[accent];

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`group flex h-full flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-8 shadow-card transition-[box-shadow,border-color] duration-300 hover:shadow-card-hover ${c.border}`}
    >
      <motion.span
        whileHover={{ rotate: 10, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 320, damping: 14 }}
        className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300 ${c.badge}`}
      >
        {icon}
      </motion.span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-xl font-semibold text-charcoal-900">{title}</h3>
        <span className={`block h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16 ${c.underline}`} />
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
    </motion.div>
  );
}
