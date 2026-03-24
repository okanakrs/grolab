"use client";

import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeepResearchProgress } from "./deep-research-progress";
import { GenerationErrorState } from "./generation-error-state";
import { Button } from "./ui/button";
import {
  ApiRequestError,
  discoverBackendContext,
  fetchCredits,
  generateIdeas,
  type IdeaGenerationResponse,
  type McpReference,
  type SaaSIdea,
} from "../lib/mcp";

const LOADING_STAGES = [
  "Google Trends verileri analiz ediliyor... (SerpApi baglantisi uzerinden)",
  "Product Hunt pazar bosluklari taraniyor... (Algolia verileri isleniyor)",
  "Claude 3.5 Sonnet ile SaaS konsepti optimize ediliyor...",
];

export function Hero() {
  const router = useRouter();
  const [references, setReferences] = useState<McpReference[]>([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<SaaSIdea[]>([]);
  const [evidence, setEvidence] = useState<IdeaGenerationResponse>({
    ideas: [],
    market_evidence: [],
    trends: [],
    competitors: [],
  });
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [generateError, setGenerateError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      const discovered = await discoverBackendContext();
      setReferences(discovered);
      setIsDiscoveryLoading(false);

      try {
        const creditStatus = await fetchCredits();
        if (creditStatus.credits_remaining <= 0) {
          router.push("/pricing");
        }
      } catch {
        // Non-blocking check for initial credit state.
      }
    };

    void loadContext();
  }, [router]);

  const onGenerate = async () => {
    setIsGenerating(true);
    setLoadingStageIndex(0);
    setIdeas([]);
    setEvidence({ ideas: [], market_evidence: [], trends: [], competitors: [] });
    setGenerateError(null);

    try {
      const nextIdeas = await generateIdeas("AI ile SaaS fikri");
      setIdeas(nextIdeas.ideas);
      setEvidence(nextIdeas);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 402) {
        router.push("/pricing");
        return;
      }

      if (error instanceof ApiRequestError && (error.status === 500 || error.status === 503)) {
        setGenerateError({
          message: error.message,
          requestId: error.requestId,
        });
      } else {
        setGenerateError({ message: "Beklenmeyen bir hata olustu. Lutfen tekrar deneyin." });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const timer = setInterval(() => {
      setLoadingStageIndex((prev) => Math.min(prev + 1, LOADING_STAGES.length - 1));
    }, 1300);

    return () => {
      clearInterval(timer);
    };
  }, [isGenerating]);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const title: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-16 pt-16 sm:px-8 sm:pt-20"
    >
      <motion.p
        variants={item}
        className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300"
      >
        Apple-esque Dark UI + MCP-aware SaaS Starter
      </motion.p>

      <motion.h1
        variants={title}
        className="mt-7 max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl"
      >
        GroLab ile yeni nesil fikir motoru:
        <span className="relative mt-1 block">
          <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-emerald-300/20 blur-2xl" />
          <span className="bg-gradient-to-r from-emerald-300 to-indigo-300 bg-clip-text text-transparent">
            AI ile SaaS Fikri Uret
          </span>
        </span>
      </motion.h1>

      <motion.p variants={item} className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
        Minimal ama etkileyici bir akista, problem alanini sec; GroLab sana
        uygulanabilir SaaS urun fikirlerini, MVP kapsamlarini ve teknik yol haritasini
        tek ekranda olustursun.
      </motion.p>

      <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="min-h-12 min-w-56 px-7 text-base disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGenerating ? "Fikirler Pişiyor..." : "AI ile SaaS Fikri Üret"}
          </Button>
        </motion.div>
        <span className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400">
          {isGenerating
            ? LOADING_STAGES[loadingStageIndex]
            : "Hazir oldugunda tek tikla fikir seti uretilir"}
        </span>
      </motion.div>

      {isGenerating ? (
        <>
          <DeepResearchProgress activeStepIndex={loadingStageIndex} />
          <div className="mt-6">
            <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/70 px-3 py-1 text-xs text-zinc-500">
              Reddit: Veri bekleniyor...
            </span>
          </div>
        </>
      ) : generateError ? (
        <GenerationErrorState
          message={generateError.message}
          requestId={generateError.requestId}
          onRetry={onGenerate}
        />
      ) : ideas.length > 0 ? (
        <motion.div variants={item} className="mt-8 grid gap-4 md:grid-cols-3">
          {ideas.map((idea, index) => (
            <article
              key={`${idea.isim}-${index}`}
              className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-soft backdrop-blur-md"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-300/80">
                Fikir {index + 1}
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                <span className="relative">
                  <span className="pointer-events-none absolute -inset-1 -z-10 rounded-lg bg-emerald-400/20 blur-xl" />
                  {idea.isim}
                </span>
              </p>

              <div className="mt-3 grid gap-3">
                {[
                  { label: "Problem", value: idea.problem },
                  { label: "Cozum", value: idea.cozum },
                  { label: "Hedef Kitle", value: idea.hedef_kitle },
                  { label: "Tahmini MRR Potansiyeli", value: idea.tahmini_mrr_potansiyeli },
                ].map((field, fieldIndex) => (
                  <motion.div
                    key={`${field.label}-${fieldIndex}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: fieldIndex * 0.06, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-lg border border-zinc-800/90 bg-zinc-950/55 p-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">{field.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">{field.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-300">Neden bu fikir?</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {evidence.market_evidence.map((itemText) => (
                    <span
                      key={itemText}
                      className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-100"
                    >
                      {itemText}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {evidence.trends.map((itemText) => (
                    <span
                      key={itemText}
                      className="rounded-full border border-indigo-300/30 bg-indigo-400/10 px-2.5 py-1 text-[11px] text-indigo-100"
                    >
                      {itemText}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {evidence.competitors.map((itemText) => (
                    <span
                      key={itemText}
                      className="rounded-full border border-zinc-300/30 bg-zinc-400/10 px-2.5 py-1 text-[11px] text-zinc-100"
                    >
                      {itemText}
                    </span>
                  ))}

                  <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-500">
                    Reddit: Yakinda
                  </span>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      ) : null}

      <motion.div variants={item} id="mcp" className="mt-10 rounded-xl border border-white/10 bg-black/30 p-5">
        <p className="text-sm font-medium text-zinc-200">MCP Backend References</p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {isDiscoveryLoading ? (
            <li className="text-zinc-500">Discovery endpoint taraniyor...</li>
          ) : (
            references.map((reference) => (
            <li key={reference.id} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>
                {reference.label}: <code>{reference.path}</code>
              </span>
            </li>
            ))
          )}
        </ul>
      </motion.div>
    </motion.section>
  );
}
