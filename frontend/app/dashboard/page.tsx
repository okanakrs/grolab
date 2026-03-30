"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "../../components/navbar";
import { PremiumToolbox } from "../../components/premium-toolbox";
import { fetchIdeaHistory, fetchCredits, type SavedIdea, type SaaSIdea } from "../../lib/mcp";
import { createClient } from "../../lib/supabase";
import { useLanguage } from "../../contexts/language-context";

const ACCENTS = [
  { dot: "bg-emerald-400", mrr: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400", label: "text-emerald-500/60", divider: "bg-emerald-500/10", glow: "shadow-[0_0_40px_-20px_rgba(16,185,129,0.35)]" },
  { dot: "bg-indigo-400", mrr: "border-indigo-500/25 bg-indigo-500/[0.08] text-indigo-400", label: "text-indigo-500/60", divider: "bg-indigo-500/10", glow: "shadow-[0_0_40px_-20px_rgba(99,102,241,0.35)]" },
  { dot: "bg-violet-400", mrr: "border-violet-500/25 bg-violet-500/[0.08] text-violet-400", label: "text-violet-500/60", divider: "bg-violet-500/10", glow: "shadow-[0_0_40px_-20px_rgba(139,92,246,0.35)]" },
];

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();
  const isEN = lang === "en";
  return (
    <div>
      <p className={`mt-2 text-sm leading-relaxed text-zinc-300${expanded ? "" : " line-clamp-4"}`}>
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-[11px] font-medium text-emerald-400 transition hover:text-emerald-300"
      >
        {expanded ? (isEN ? "Show less ↑" : "Gizle ↑") : (isEN ? "Show more →" : "Devamını gör →")}
      </button>
    </div>
  );
}

function IdeaDetailModal({ idea, onClose, accent, userPlan, td }: {
  idea: SaaSIdea;
  onClose: () => void;
  accent: typeof ACCENTS[0];
  userPlan: string;
  td: { solution: string; targetAudience: string; close: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 p-6 sm:p-8 ${accent.glow}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">{idea.isim}</h3>
          <span className={`flex-shrink-0 rounded-full border px-3.5 py-1 text-xs font-semibold ${accent.mrr}`}>
            {idea.tahmini_mrr_potansiyeli}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{idea.problem}</p>

        <div className={`my-5 h-px ${accent.divider}`} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accent.label}`}>{td.solution}</p>
            <ExpandableText text={idea.cozum} />
          </div>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accent.label}`}>{td.targetAudience}</p>
            <ExpandableText text={idea.hedef_kitle} />
          </div>
        </div>

        <div className={`my-5 h-px ${accent.divider}`} />

        <PremiumToolbox idea={idea} plan={userPlan} />

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-white/[0.08] py-2.5 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
        >
          {td.close}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const td = t.dashboard;
  const [history, setHistory] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("free");
  const [selected, setSelected] = useState<{ idea: SaaSIdea; accent: typeof ACCENTS[0] } | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/sign-in");
        return;
      }
      const [items, credits] = await Promise.all([fetchIdeaHistory(), fetchCredits().catch(() => null)]);
      setHistory(items);
      if (credits) setUserPlan(credits.plan);
      setLoading(false);
    }
    init();
  }, [router]);

  const dateLocale = lang === "tr" ? "tr-TR" : "en-US";

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20rem] top-[-15rem] h-[45rem] w-[45rem] rounded-full bg-emerald-500/[0.07] blur-[130px]" />
        <div className="absolute bottom-[-12rem] right-[-18rem] h-[40rem] w-[40rem] rounded-full bg-indigo-500/[0.07] blur-[130px]" />
      </div>

      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            {td.title1}{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              {td.titleHighlight}
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{td.subtitle}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-24 text-center">
            <p className="text-zinc-400">{td.empty}</p>
            <a
              href="/#idea-topic"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
            >
              {td.emptyBtn}
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/60"
              >
                {/* Entry header */}
                <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
                  <div>
                    <span className="text-sm font-semibold text-white">{entry.topic || td.randomTopic}</span>
                    <span className="ml-3 text-xs text-zinc-600">
                      {new Date(entry.created_at).toLocaleDateString(dateLocale, {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="rounded-full border border-white/[0.06] px-2.5 py-0.5 text-[11px] text-zinc-500">
                    {td.ideaCount(entry.ideas.length)}
                  </span>
                </div>

                {/* Ideas grid */}
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {entry.ideas.map((idea, i) => {
                    const ac = ACCENTS[i % ACCENTS.length];
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelected({ idea, accent: ac })}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-left transition hover:border-white/[0.1] hover:bg-white/[0.04]"
                      >
                        <div className="flex w-full flex-col gap-1.5">
                          <span className={`self-start rounded-full border px-2 py-0.5 text-[10px] font-semibold truncate max-w-full ${ac.mrr}`}>
                            {idea.tahmini_mrr_potansiyeli.split("(")[0].trim()}
                          </span>
                          <span className="text-sm font-semibold text-white leading-snug line-clamp-2">
                            {idea.isim}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-zinc-500 line-clamp-2">{idea.problem}</p>
                        <span className="mt-auto text-[10px] text-zinc-600 group-hover:text-zinc-400 transition">
                          {td.viewDetail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <IdeaDetailModal
            idea={selected.idea}
            accent={selected.accent}
            userPlan={userPlan}
            td={td}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
