"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type ResearchStep = {
  id: string;
  icon: ReactNode;
  label: string;
  detail?: string;
  status: "pending" | "active" | "done";
  locked?: boolean;
};

type Props = {
  steps: ResearchStep[];
  panelTitle: string;
};

export function DeepResearchProgress({ steps, panelTitle }: Props) {
  const activeSteps = steps.filter((s) => !s.locked);
  const doneCount = activeSteps.filter((s) => s.status === "done").length;
  const progress = activeSteps.length === 0 ? 0 : Math.round((doneCount / activeSteps.length) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mt-7 overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/60 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            {panelTitle}
          </p>
        </div>
        <span className="font-mono text-xs tabular-nums text-zinc-600">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] w-full bg-zinc-900">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <ul className="divide-y divide-white/[0.035]">
        {steps.map((step, i) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={[
              "flex items-center gap-3.5 px-5 py-3 transition-colors duration-300",
              step.locked
                ? "opacity-40"
                : step.status === "active"
                ? "bg-emerald-500/[0.05]"
                : "",
            ].join(" ")}
          >
            {/* Source icon */}
            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center ${step.locked ? "grayscale" : ""}`}>
              {step.icon}
            </span>

            {/* Label + detail */}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium leading-none ${
                step.locked
                  ? "text-zinc-600"
                  : step.status === "active"
                  ? "text-emerald-200"
                  : step.status === "done"
                  ? "text-zinc-500"
                  : "text-zinc-700"
              }`}>
                {step.label}
                {step.locked && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                    — Pro
                  </span>
                )}
              </p>
              <AnimatePresence>
                {step.detail && !step.locked && (
                  <motion.p
                    key="detail"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 3 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden text-[11px] text-emerald-400/60"
                  >
                    {step.detail}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Status indicator */}
            <span className="ml-auto flex-shrink-0">
              {step.locked ? (
                <Link href="/pricing">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800 text-zinc-700 transition hover:border-emerald-500/40 hover:text-emerald-500">
                    <Lock size={9} strokeWidth={2} />
                  </span>
                </Link>
              ) : step.status === "done" ? (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400"
                >
                  ✓
                </motion.span>
              ) : step.status === "active" ? (
                <motion.span
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-400"
                >
                  ●
                </motion.span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800/60 text-[9px] text-zinc-800">
                  ○
                </span>
              )}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
