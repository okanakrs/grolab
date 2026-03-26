"use client";

import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeepResearchProgress, type ResearchStep } from "./deep-research-progress";
import { GenerationErrorState } from "./generation-error-state";
import { useLanguage } from "../contexts/language-context";
import {
  ApiRequestError,
  fetchCredits,
  generateIdeasStream,
  type IdeaGenerationResponse,
  type McpReference,
  type SaaSIdea,
} from "../lib/mcp";
import { IdeaPanel } from "./idea-panel";

export function Hero() {
  const router = useRouter();
  const { t } = useLanguage();
  const th = t.hero;

  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<SaaSIdea[]>([]);
  const [evidence, setEvidence] = useState<IdeaGenerationResponse>({
    ideas: [],
    market_evidence: [],
    trends: [],
    competitors: [],
  });
  const [generateError, setGenerateError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  // Yeni: Kaç fikir üretileceğini tutan state
  const [ideaCount, setIdeaCount] = useState(3);
  const [userPlan, setUserPlan] = useState("free");

  useEffect(() => {
    const loadContext = async () => {
      try {
        const creditStatus = await fetchCredits();
        setUserPlan(creditStatus.plan);
        if (creditStatus.credits_remaining <= 0) {
          router.push("/pricing");
        }
      } catch {
        // Non-blocking check for initial credit state.
      }
    };

    void loadContext();
  }, [router]);

  const STEP_META: Record<string, { icon: string; label: string }> = {
    research_start: { icon: "🔍", label: "Pazar araştırması başlıyor..." },
    reddit_done:    { icon: "💬", label: "Reddit tarıyorum..." },
    hn_done:        { icon: "🟧", label: "Hacker News analiz ediyorum..." },
    producthunt_done: { icon: "🚀", label: "Product Hunt tarıyorum..." },
    trends_done:    { icon: "📈", label: "Google Trends analiz ediyorum..." },
    appstore_done:  { icon: "📱", label: "App Store inceliyorum..." },
    llm_start:      { icon: "🧠", label: "Fırsat skoru hesaplanıyor..." },
  };

  const onGenerate = async () => {
    setIsGenerating(true);
    setResearchSteps([]);
    setIdeas([]);
    setEvidence({ ideas: [], market_evidence: [], trends: [], competitors: [] });
    setGenerateError(null);

    try {
      for await (const event of generateIdeasStream(topic.trim(), ideaCount)) {
        if (event.step === "error") {
          if (event.status === 402) { router.push("/pricing"); return; }
          setGenerateError({ message: event.message });
          return;
        }
        if (event.step === "done") {
          setIdeas(event.ideas ?? []);
          setEvidence({ ideas: event.ideas ?? [], market_evidence: event.market_evidence ?? [], trends: event.trends ?? [], competitors: event.competitors ?? [] });
          window.dispatchEvent(new CustomEvent("credits-updated"));
          return;
        }
        // progress event
        const meta = STEP_META[event.step];
        if (!meta) continue;
        const detail = event.count > 0 ? `${event.count} sonuç bulundu` : undefined;
        setResearchSteps((prev) => {
          const existing = prev.find((s) => s.id === event.step);
          if (existing) {
            return prev.map((s) => s.id === event.step ? { ...s, status: "done", detail: detail ?? s.detail } : s.status === "active" ? { ...s, status: "done" } : s);
          }
          const updated = prev.map((s) => s.status === "active" ? { ...s, status: "done" as const } : s);
          return [...updated, { id: event.step, icon: meta.icon, label: meta.label, detail, status: "active" as const }];
        });
      }
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setGenerateError({ message: error.message, requestId: error.requestId });
      } else {
        setGenerateError({ message: th.errorUnexpected });
      }
    } finally {
      setIsGenerating(false);
    }
  };

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
        <strong className="font-medium text-zinc-200">{th.subtitleGT}</strong>,{" "}
        <strong className="font-medium text-zinc-200">{th.subtitleReddit}</strong>,{" "}
        <strong className="font-medium text-zinc-200">Hacker News</strong>{" "}
        {th.subtitleEnd}
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

          <div className="mt-5 flex items-center justify-end gap-3">
            {/* Fikir adedi seçici */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 font-medium select-none">Fikir sayısı</span>
              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIdeaCount(n)}
                    disabled={isGenerating}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 focus:outline-none disabled:cursor-not-allowed
                      ${ideaCount === n
                        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25"
                        : "text-zinc-500 hover:text-zinc-300"}`}
                    aria-label={`${n} fikir üret`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
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
              ? `⟳  ${researchSteps.find(s => s.status === "active")?.label ?? "Başlatılıyor..."}`
              : th.statusReady}
          </p>
        </div>
      </motion.div>

      {/* Dynamic area */}
      {isGenerating ? (
        <DeepResearchProgress steps={researchSteps} />
      ) : generateError ? (
        <GenerationErrorState
          message={generateError.message}
          requestId={generateError.requestId}
          onRetry={onGenerate}
        />
      ) : ideas.length > 0 ? (
        <IdeaPanel
          ideas={ideas}
          evidence={evidence}
          userPlan={userPlan}
          th={th}
        />
      ) : null}

    </motion.section>
  );
}
