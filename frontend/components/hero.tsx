"use client";

import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeepResearchProgress } from "./deep-research-progress";
import { GenerationErrorState } from "./generation-error-state";
import { useLanguage } from "../contexts/language-context";
import {
  ApiRequestError,
  discoverBackendContext,
  fetchCredits,
  generateIdeas,
  type IdeaGenerationResponse,
  type McpReference,
  type SaaSIdea,
} from "../lib/mcp";

export function Hero() {
  const router = useRouter();
  const { t } = useLanguage();
  const th = t.hero;

  const [references, setReferences] = useState<McpReference[]>([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
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
      const promptTopic = topic.trim() || "AI SaaS idea";
      const nextIdeas = await generateIdeas(promptTopic);
      setIdeas(nextIdeas.ideas);
      setEvidence(nextIdeas);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 402) {
        router.push("/pricing");
        return;
      }

      if (error instanceof ApiRequestError) {
        setGenerateError({ message: error.message, requestId: error.requestId });
      } else {
        setGenerateError({ message: th.errorUnexpected });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isGenerating) return;

    const timer = setInterval(() => {
      setLoadingStageIndex((prev) => Math.min(prev + 1, th.loadingStages.length - 1));
    }, 1300);

    return () => clearInterval(timer);
  }, [isGenerating, th.loadingStages.length]);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-24 pt-14 sm:px-8 sm:pt-20"
    >
      {/* Badge */}
      <motion.div variants={item} className="flex">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {th.badge}
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        variants={item}
        className="mt-6 max-w-4xl text-balance text-5xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-7xl"
      >
        {th.headline1}{" "}
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            {th.headlineHighlight}
          </span>
          <svg
            className="absolute -bottom-1.5 left-0 w-full opacity-60"
            viewBox="0 0 300 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2 6 C60 2, 120 1, 180 3.5 S260 6, 298 2"
              stroke="url(#ug)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="ug" x1="0" y1="0" x2="300" y2="0">
                <stop stopColor="#34d399" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <br className="hidden sm:block" />
        {th.headline2}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={item}
        className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg"
      >
        {th.subtitleStart}{" "}
        <strong className="font-medium text-zinc-200">{th.subtitlePH}</strong>,{" "}
        <strong className="font-medium text-zinc-200">{th.subtitleGT}</strong>{" "}
        {th.subtitleEnd.includes("ve") || th.subtitleEnd.startsWith("data") ? "" : "ve "}
        {th.subtitleEnd.startsWith("data") ? (
          <>
            <strong className="font-medium text-zinc-200">{th.subtitleReddit}</strong>{" "}
            {th.subtitleEnd}
          </>
        ) : (
          <>
            <strong className="font-medium text-zinc-200">{th.subtitleReddit}</strong>{" "}
            {th.subtitleEnd}
          </>
        )}
      </motion.p>

      {/* Stats */}
      <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-6">
        {th.stats.map((stat, i) => (
          <div key={stat.label} className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{stat.value}</span>
            <span className="text-xs text-zinc-600">{stat.label}</span>
            {i < th.stats.length - 1 && (
              <span className="ml-4 text-zinc-800">·</span>
            )}
          </div>
        ))}
      </motion.div>

      {/* Input card */}
      <motion.div
        variants={item}
        className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 font-mono text-[11px] text-zinc-700">{th.windowTitle}</span>
        </div>

        <div className="p-5 sm:p-6">
          <label
            htmlFor="idea-topic"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600"
          >
            {th.inputLabel}
          </label>
          <textarea
            id="idea-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            className="mt-2 w-full resize-none bg-transparent text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-700"
            placeholder={th.inputPlaceholder}
          />

          {/* Quick tag pills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {th.quickTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTopic(tag)}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-500 transition hover:border-emerald-500/40 hover:text-emerald-300"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-end">
            <motion.button
              onClick={onGenerate}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/25 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    {th.generatingBtn}
                  </>
                ) : (
                  <>
                    <span className="text-xs">✦</span>
                    {th.generateBtn}
                  </>
                )}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Status bar */}
        <div className="border-t border-white/[0.04] bg-black/30 px-5 py-2.5">
          <p className="font-mono text-[11px] text-zinc-700">
            {isGenerating
              ? `⟳  ${th.loadingStages[loadingStageIndex]}`
              : th.statusReady}
          </p>
        </div>
      </motion.div>

      {/* Dynamic area */}
      {isGenerating ? (
        <DeepResearchProgress activeStepIndex={loadingStageIndex} />
      ) : generateError ? (
        <GenerationErrorState
          message={generateError.message}
          requestId={generateError.requestId}
          onRetry={onGenerate}
        />
      ) : ideas.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="mt-10">
          <motion.div variants={item} className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {th.ideasGenerated(ideas.length)}
            </h2>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {th.marketSupported}
            </span>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {ideas.map((idea, index) => (
              <motion.article
                key={`${idea.isim}-${index}`}
                variants={item}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 transition group-hover:opacity-100" />

                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  #{index + 1}
                </span>

                <h3 className="mt-3 text-base font-bold leading-tight text-white">
                  {idea.isim}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                  {idea.problem}
                </p>

                <div className="mt-4 space-y-2">
                  <div className="rounded-xl bg-zinc-950/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                      {th.solution}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">{idea.cozum}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                      {th.targetAudience}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{idea.hedef_kitle}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                      {th.estimatedMRR}
                    </p>
                    <p className="mt-1 text-xs font-medium text-emerald-400">
                      {idea.tahmini_mrr_potansiyeli}
                    </p>
                  </div>
                </div>

                {/* Evidence */}
                <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/30 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                    {th.marketEvidence}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {evidence.market_evidence.slice(0, 2).map((e) => (
                      <span
                        key={e}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400"
                      >
                        {e}
                      </span>
                    ))}
                    {evidence.trends.slice(0, 1).map((trend) => (
                      <span
                        key={trend}
                        className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400"
                      >
                        {trend}
                      </span>
                    ))}
                    {evidence.competitors.slice(0, 1).map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* MCP References */}
      <motion.div
        variants={item}
        id="mcp"
        className="mt-14 rounded-2xl border border-white/[0.05] bg-black/20 p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            {th.mcpTitle}
          </p>
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {isDiscoveryLoading ? (
            <li className="font-mono text-xs text-zinc-700">{th.mcpScanning}</li>
          ) : (
            references.map((reference) => (
              <li
                key={reference.id}
                className="flex items-center gap-2 rounded-xl border border-zinc-800/50 bg-zinc-900/20 px-3 py-2"
              >
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400/50" />
                <span className="text-xs text-zinc-600">
                  {reference.label}:{" "}
                  <code className="font-mono text-zinc-500">{reference.path}</code>
                </span>
              </li>
            ))
          )}
        </ul>
      </motion.div>
    </motion.section>
  );
}
