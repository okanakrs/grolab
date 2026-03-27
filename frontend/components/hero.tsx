"use client";

import { motion, type Variants } from "framer-motion";
import { Lock, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { DeepResearchProgress, type ResearchStep } from "./deep-research-progress";
import { GenerationErrorState } from "./generation-error-state";
import { useLanguage } from "../contexts/language-context";
import {
  ApiRequestError,
  clearGuestToken,
  fetchCredits,
  generateIdeasStream,
  type IdeaGenerationResponse,
  type McpReference,
  type SaaSIdea,
} from "../lib/mcp";
import { IdeaPanel } from "./idea-panel";
import { GuestLimitModal } from "./guest-limit-modal";

function HeroMockup() {
  const float = {
    animate: { y: [0, -10, 0] },
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
  };

  const favicon = (src: string) => (
    <Image src={src} alt="" width={14} height={14} className="h-3.5 w-3.5 rounded-sm object-contain" unoptimized />
  );

  return (
    <div className="relative h-[420px] w-full max-w-[400px] select-none">

      {/* Card 1 — evidence + actions (behind, rotated +1deg) */}
      <motion.div
        animate={float.animate}
        transition={{ ...float.transition, delay: 0.4 }}
        className="absolute left-6 top-[120px] w-[340px] rounded-2xl border border-white/[0.07] bg-zinc-950/80 p-4 shadow-2xl backdrop-blur-md"
        style={{ rotate: "1deg" }}
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Market Evidence
        </p>
        <div className="space-y-2">
          {[
            { icon: favicon("https://www.reddit.com/favicon.ico"),       label: "234 mentions", color: "text-orange-400/80" },
            { icon: favicon("https://news.ycombinator.com/favicon.ico"), label: "12 threads",   color: "text-amber-400/80"  },
            { icon: favicon("https://www.google.com/favicon.ico"),       label: "Breakout ↑",   color: "text-teal-400/80"   },
          ].map(({ icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
              <span className="flex-shrink-0">{icon}</span>
              <span className={`text-xs font-medium ${color}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Marketing Strategy", "Tech Stack", "Competitor Analysis", "Roadmap"].map((label) => (
            <span key={label} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-zinc-500">
              {label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Card 2 — idea card (front, rotated -2deg) */}
      <motion.div
        animate={float.animate}
        transition={float.transition}
        className="absolute left-0 top-0 w-[340px] rounded-2xl border border-teal-500/30 bg-zinc-950/90 p-5 shadow-[0_0_60px_-15px_rgba(20,184,166,0.25)] backdrop-blur-md"
        style={{ rotate: "-2deg" }}
      >
        <div className="absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-500/70">SaaS Idea #1</p>
            <h3 className="mt-1 text-xl font-bold text-white">AsyncMeet</h3>
          </div>
          <span className="flex-shrink-0 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-300">
            $8K–$25K MRR
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Async video meeting platform for remote teams — eliminating timezone friction with AI-generated summaries.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "Target", value: "Remote Teams" },
            { label: "Market", value: "Growing ↑" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-300">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">Opportunity Score</span>
            <span className="text-[10px] font-bold text-teal-400">87 / 100</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
              initial={{ width: "0%" }}
              animate={{ width: "87%" }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </motion.div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.07] blur-[80px]" />
    </div>
  );
}

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const creditStatus = await fetchCredits();
        setUserPlan(creditStatus.plan);
        if (creditStatus.plan === "free") setIdeaCount(1);
        if (creditStatus.credits_remaining <= 0) {
          router.push("/pricing");
        }
      } catch {
        // Non-blocking check for initial credit state.
      }
    };

    void loadContext();
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: unknown } | null) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const favicon = (src: string) => (
    <Image src={src} alt="" width={16} height={16} className="h-4 w-4 rounded-sm object-contain" unoptimized />
  );

  const STEP_META: Record<string, { icon: React.ReactNode; label: string }> = {
    research_start:   { icon: <Search size={16} color="#71717a" strokeWidth={1.75} />, label: "Pazar araştırması başlıyor..." },
    reddit_done:      { icon: favicon("https://www.reddit.com/favicon.ico"),           label: "Reddit tarıyorum..." },
    hn_done:          { icon: favicon("https://news.ycombinator.com/favicon.ico"),     label: "Hacker News analiz ediyorum..." },
    producthunt_done: { icon: favicon("https://ph-static.imgix.net/ph-favicon.ico"),   label: "Product Hunt tarıyorum..." },
    trends_done:      { icon: favicon("https://www.google.com/favicon.ico"),           label: "Google Trends analiz ediyorum..." },
    appstore_done:    { icon: favicon("https://www.apple.com/favicon.ico"),            label: "App Store inceliyorum..." },
    llm_start:        { icon: <Sparkles size={16} color="#71717a" strokeWidth={1.75} />, label: "Fırsat skoru hesaplanıyor..." },
  };

  const onGenerate = async () => {
    const isPro = userPlan === "pro" || userPlan === "enterprise";
    setIsGenerating(true);
    // Free kullanıcılara kilitli adımları baştan göster
    setResearchSteps(
      isPro
        ? []
        : [
            { id: "hn_done",       icon: favicon("https://news.ycombinator.com/favicon.ico"), label: "Hacker News analizi",   status: "pending", locked: true },
            { id: "appstore_done", icon: favicon("https://www.apple.com/favicon.ico"),            label: "App Store incelemeleri", status: "pending", locked: true },
          ]
    );
    setIdeas([]);
    setEvidence({ ideas: [], market_evidence: [], trends: [], competitors: [] });
    setGenerateError(null);

    try {
      for await (const event of generateIdeasStream(topic.trim(), ideaCount)) {
        if (event.step === "error") {
          if (event.status === 402) { router.push("/pricing"); return; }
          if (event.status === 403) { setShowGuestModal(true); return; }
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
          // Kilitli adımların önüne ekle (kilitliler hep sonda kalsın)
          const lockedSteps = updated.filter((s) => s.locked);
          const activeSteps = updated.filter((s) => !s.locked);
          return [...activeSteps, { id: event.step, icon: meta.icon, label: meta.label, detail, status: "active" as const }, ...lockedSteps];
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
    hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <>
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:px-8 sm:pt-20"
      style={{ willChange: "opacity" }}
    >
      {/* ── Top: 2-column (text left, mockup right) ── */}
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">

        {/* Left: copy */}
        <div className="flex flex-col">
          <motion.div variants={item} className="flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {th.badge}
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-balance text-5xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-6xl"
          >
            {th.headline1}{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {th.headlineHighlight}
              </span>
              <svg className="absolute -bottom-1.5 left-0 w-full opacity-60" viewBox="0 0 300 8" fill="none" aria-hidden="true">
                <path d="M2 6 C60 2, 120 1, 180 3.5 S260 6, 298 2" stroke="url(#ug)" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="ug" x1="0" y1="0" x2="300" y2="0">
                    <stop stopColor="#34d399" /><stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br className="hidden sm:block" />
            {th.headline2}
          </motion.h1>

          <motion.p variants={item} className="mt-5 max-w-lg text-base leading-relaxed text-zinc-400">
            {th.subtitleStart}{" "}
            <strong className="font-medium text-zinc-200">{th.subtitlePH}</strong>,{" "}
            <strong className="font-medium text-zinc-200">{th.subtitleGT}</strong>,{" "}
            <strong className="font-medium text-zinc-200">{th.subtitleReddit}</strong>,{" "}
            <strong className="font-medium text-zinc-200">Hacker News</strong>{" "}
            {th.subtitleEnd}
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-6">
            {th.stats.map((stat, i) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">{stat.value}</span>
                <span className="text-xs text-zinc-600">{stat.label}</span>
                {i < th.stats.length - 1 && <span className="ml-4 text-zinc-800">·</span>}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: mockup (desktop only) */}
        <motion.div variants={item} className="hidden lg:flex lg:items-center lg:justify-center">
          <HeroMockup />
        </motion.div>
      </div>

      {/* ── Bottom: input card full-width ── */}
      <motion.div
        variants={item}
        className="mt-10 overflow-hidden rounded-2xl border border-white/[0.09] bg-black/55 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgb(52_211_153/0.08)]"
      >
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 font-mono text-[11px] text-zinc-700">{th.windowTitle}</span>
        </div>

        <div className="p-5 sm:p-6">
          <label htmlFor="idea-topic" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            {th.inputLabel}
          </label>
          <textarea
            id="idea-topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            className="mt-2 w-full resize-none overflow-hidden bg-transparent text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-700"
            placeholder={th.inputPlaceholder}
          />

          <div className="mt-4 flex flex-wrap gap-1.5">
            {th.quickTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTopic(tag)}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-500 transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] hover:text-emerald-300 active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="select-none text-xs font-medium text-zinc-600">Fikir sayısı</span>
              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
                {[1, 2, 3].map((n) => {
                  const isPro = userPlan === "pro" || userPlan === "enterprise";
                  const locked = !isPro && n > 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => !locked && setIdeaCount(n)}
                      disabled={isGenerating || locked}
                      title={locked ? "Pro plana geç" : undefined}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus:outline-none
                        ${locked ? "cursor-not-allowed text-zinc-700"
                          : ideaCount === n ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25"
                          : "text-zinc-500 hover:text-zinc-300"}
                        ${isGenerating ? "cursor-not-allowed" : ""}`}
                      aria-label={`${n} fikir üret`}
                    >
                      {locked ? <Lock size={11} strokeWidth={2} /> : n}
                    </button>
                  );
                })}
              </div>
            </div>
            <motion.button
              onClick={onGenerate}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-500/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isGenerating ? (
                  <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />{th.generatingBtn}</>
                ) : (
                  <><span className="text-xs">✦</span>{th.generateBtn}</>
                )}
              </span>
            </motion.button>
          </div>
        </div>

        {(!isLoggedIn || isGenerating) && (
          <div className="border-t border-white/[0.04] bg-black/30 px-5 py-2.5">
            <p className="font-mono text-[11px] text-zinc-700">
              {isGenerating
                ? `⟳  ${researchSteps.find(s => s.status === "active")?.label ?? "Başlatılıyor..."}`
                : th.statusReady}
            </p>
          </div>
        )}
      </motion.div>

      {/* Dynamic area */}
      {isGenerating && <DeepResearchProgress steps={researchSteps} />}
      {generateError && (
        <GenerationErrorState message={generateError.message} requestId={generateError.requestId} onRetry={onGenerate} />
      )}
      {ideas.length > 0 && (
        <IdeaPanel ideas={ideas} evidence={evidence} userPlan={userPlan} th={th} />
      )}
    </motion.section>

    <GuestLimitModal
      open={showGuestModal}
      onClose={() => {
        setShowGuestModal(false);
        clearGuestToken();
      }}
    />
    </>
  );
}
