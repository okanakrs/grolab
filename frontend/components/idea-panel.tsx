"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PremiumToolbox } from "./premium-toolbox";
import type { IdeaGenerationResponse, SaaSIdea } from "../lib/mcp";

const ACCENTS = [
  {
    tab: "border-emerald-500/40 text-emerald-300",
    tabActive: "border-emerald-400 text-white bg-emerald-500/10",
    dot: "bg-emerald-400",
    mrr: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400",
    glow: "shadow-[0_0_40px_-20px_rgba(16,185,129,0.35)]",
    label: "text-emerald-500/60",
    divider: "bg-emerald-500/10",
  },
  {
    tab: "border-indigo-500/40 text-indigo-300",
    tabActive: "border-indigo-400 text-white bg-indigo-500/10",
    dot: "bg-indigo-400",
    mrr: "border-indigo-500/25 bg-indigo-500/[0.08] text-indigo-400",
    glow: "shadow-[0_0_40px_-20px_rgba(99,102,241,0.35)]",
    label: "text-indigo-500/60",
    divider: "bg-indigo-500/10",
  },
  {
    tab: "border-violet-500/40 text-violet-300",
    tabActive: "border-violet-400 text-white bg-violet-500/10",
    dot: "bg-violet-400",
    mrr: "border-violet-500/25 bg-violet-500/[0.08] text-violet-400",
    glow: "shadow-[0_0_40px_-20px_rgba(139,92,246,0.35)]",
    label: "text-violet-500/60",
    divider: "bg-violet-500/10",
  },
];

interface Props {
  ideas: SaaSIdea[];
  evidence: IdeaGenerationResponse;
  userPlan: string;
  th: {
    ideasGenerated: (n: number) => string;
    marketSupported: string;
    solution: string;
    targetAudience: string;
    estimatedMRR: string;
    marketEvidence: string;
  };
}

export function IdeaPanel({ ideas, evidence, userPlan, th }: Props) {
  const [active, setActive] = useState(0);
  const idea = ideas[active];
  const ac = ACCENTS[active % ACCENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10"
    >
      {/* Header row */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.05]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {th.ideasGenerated(ideas.length)}
        </span>
        <div className="h-px flex-1 bg-white/[0.05]" />
      </div>

      {/* Tab strip */}
      <div className="flex gap-2 overflow-x-auto pb-px">
        {ideas.map((idea, i) => {
          const a = ACCENTS[i % ACCENTS.length];
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive ? a.tabActive : "border-white/[0.05] text-zinc-600 hover:border-white/[0.1] hover:text-zinc-300"
              }`}
            >
              <span className={`font-mono text-[11px] font-bold ${isActive ? "" : "text-zinc-700"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="max-w-[180px] truncate">{idea.isim}</span>
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className={`absolute bottom-0 left-4 right-4 h-px ${a.dot}`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div className={`mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/60 backdrop-blur-sm ${ac.glow}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 sm:p-8"
          >
            {/* Title + MRR */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                {idea.isim}
              </h3>
              <span className={`flex-shrink-0 max-w-[220px] truncate rounded-full border px-3.5 py-1 text-xs font-semibold ${ac.mrr}`}
                title={idea.tahmini_mrr_potansiyeli}
              >
                {idea.tahmini_mrr_potansiyeli}
              </span>
            </div>

            {/* Problem */}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {idea.problem}
            </p>

            {/* Divider */}
            <div className={`my-6 h-px ${ac.divider}`} />

            {/* Solution + Target — two columns */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${ac.label}`}>
                  {th.solution}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300 line-clamp-5">{idea.cozum}</p>
              </div>
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${ac.label}`}>
                  {th.targetAudience}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{idea.hedef_kitle}</p>
                <div className={`mt-4 h-px ${ac.divider}`} />
                <p className={`mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] ${ac.label}`}>
                  {th.estimatedMRR}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{idea.tahmini_mrr_potansiyeli}</p>
              </div>
            </div>

            {/* Evidence */}
            {(evidence.market_evidence.length > 0 || evidence.trends.length > 0 || evidence.competitors.length > 0) && (
              <>
                <div className={`my-6 h-px ${ac.divider}`} />
                <div>
                  <p className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] ${ac.label}`}>
                    {th.marketEvidence}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {evidence.market_evidence.slice(0, 2).map((e) => (
                      <span key={e} className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1 text-xs text-emerald-400/80">
                        {e}
                      </span>
                    ))}
                    {evidence.trends.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-1 text-xs text-indigo-400/80">
                        {t}
                      </span>
                    ))}
                    {evidence.competitors.slice(0, 2).map((c) => (
                      <span key={c} className="rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-xs text-zinc-500">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <PremiumToolbox idea={idea} plan={userPlan} />
    </motion.div>
  );
}
