"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useState } from "react";
import { Navbar } from "../../components/navbar";
import { createCheckout } from "../../lib/mcp";
import { useLanguage } from "../../contexts/language-context";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: i * 0.1,
    },
  }),
};

const YEARLY_DISCOUNT = 0.21;


// Feature comparison rows — (label, free, pro, enterprise)
type FeatureRow =
  | { type: "group"; label: string }
  | { type: "row"; label: string; free: string | boolean; pro: string | boolean; enterprise: string | boolean };

const COMPARE_ROWS: FeatureRow[] = [
  { type: "group", label: "Araştırma & Veri" },
  { type: "row", label: "Aylık kredi",                free: "10",       pro: "100",             enterprise: "1000+" },
  { type: "row", label: "Veri kaynağı sayısı",        free: "3",        pro: "5",               enterprise: "5+" },
  { type: "row", label: "Reddit araştırması",         free: true,       pro: true,              enterprise: true },
  { type: "row", label: "Google Trends analizi",      free: true,       pro: true,              enterprise: true },
  { type: "row", label: "Product Hunt taraması",      free: true,       pro: true,              enterprise: true },
  { type: "row", label: "Hacker News analizi",        free: false,      pro: true,              enterprise: true },
  { type: "row", label: "App Store incelemeleri",     free: false,      pro: true,              enterprise: true },
  { type: "group", label: "Fikir Üretimi" },
  { type: "row", label: "Tek seferde max fikir",      free: "1",        pro: "3",               enterprise: "5" },
  { type: "row", label: "Market evidence özeti",      free: "Temel",    pro: "Geliştirilmiş",   enterprise: "Özel" },
  { type: "row", label: "Fırsat skoru",               free: false,      pro: true,              enterprise: true },
  { type: "row", label: "MVP kapsam önerisi",         free: false,      pro: true,              enterprise: true },
  { type: "row", label: "Fikir geçmişi & dashboard",  free: true,       pro: true,              enterprise: true },
  { type: "group", label: "Destek & Erişim" },
  { type: "row", label: "Topluluk desteği",           free: true,       pro: true,              enterprise: true },
  { type: "row", label: "Öncelikli destek",           free: false,      pro: true,              enterprise: true },
  { type: "row", label: "Özel model routing",         free: false,      pro: false,             enterprise: true },
  { type: "row", label: "Takım & yönetim paneli",     free: false,      pro: false,             enterprise: true },
  { type: "row", label: "SLA garantisi",              free: false,      pro: false,             enterprise: true },
];

function Check() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
      ✓
    </span>
  );
}
function Cross() {
  return <span className="text-zinc-700 text-sm">—</span>;
}
function Cell({ val }: { val: string | boolean }) {
  if (val === true) return <Check />;
  if (val === false) return <Cross />;
  return <span className="text-xs font-medium text-zinc-300">{val}</span>;
}

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<"pro" | "enterprise" | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [showCompare, setShowCompare] = useState(true);
  const { t } = useLanguage();
  const tp = t.pricing;

  const onCheckout = async (plan: "pro" | "enterprise") => {
    setIsLoading(plan);
    try {
      const checkoutUrl = await createCheckout(plan);
      window.location.href = checkoutUrl;
    } catch {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      id: "free" as const,
      label: "Free",
      price: "$0",
      yearlyPrice: "$0",
      credits: "10 kredi / ay",
      desc: "Fikri olan, piyasayı test etmek isteyen herkes için.",
      color: "zinc" as const,
      features: [
        "3 veri kaynağı (Reddit, Trends, PH)",
        "10 aylık kredi",
        "Temel market evidence",
        "Fikir geçmişi",
      ],
      btn: "Mevcut Plan",
      cta: false,
    },
    {
      id: "pro" as const,
      label: "Pro",
      price: "$19/ay",
      yearlyPrice: `$${Math.round(19 * (1 - YEARLY_DISCOUNT))}/mo`,
      credits: "100 kredi / ay",
      desc: "Doğrulanmış fikirlerle ilerlemeye hazır kurucular için.",
      badge: "En Popüler",
      color: "emerald" as const,
      features: [
        "5 veri kaynağı (+ HN & App Store)",
        "100 aylık kredi",
        "Geliştirilmiş market sinyalleri",
        "Fırsat skoru & MVP önerisi",
        "3'e kadar fikir / üretim",
        "Öncelikli destek",
      ],
      btn: "Pro ile Başla",
      cta: true,
    },
    {
      id: "enterprise" as const,
      label: "Enterprise",
      price: "Custom",
      yearlyPrice: "Custom",
      credits: "1000+ kredi / ay",
      desc: "Büyüyen ekipler ve yüksek hacimli araştırma için.",
      color: "indigo" as const,
      features: [
        "Her şey Pro'da +",
        "1000+ aylık kredi",
        "Özel model routing",
        "Takım & yönetim paneli",
        "SLA garantisi",
        "Öncelikli onboarding",
      ],
      btn: "Bize Ulaşın",
      cta: false,
    },
  ];

  const colorMap = {
    zinc:    { border: "border-white/[0.07]",    ring: "",                          dot: "text-zinc-500",    label: "text-zinc-400",    glow: "" },
    emerald: { border: "border-emerald-500/40",  ring: "ring-1 ring-emerald-500/20", dot: "text-emerald-400", label: "text-emerald-300",  glow: "shadow-[0_0_80px_-20px_rgba(16,185,129,0.45)]" },
    indigo:  { border: "border-indigo-500/25",   ring: "",                          dot: "text-indigo-400",  label: "text-indigo-300",   glow: "" },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="animate-blob absolute left-[-20rem] top-[-15rem] h-[50rem] w-[50rem] rounded-full bg-emerald-500/[0.07] blur-[140px]" />
        <div className="animate-blob-reverse absolute bottom-[-10rem] right-[-15rem] h-[40rem] w-[40rem] rounded-full bg-indigo-500/[0.06] blur-[140px]" />
      </div>

      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-14 sm:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            {tp.badge}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              {tp.title}
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-500">{tp.subtitle}</p>

          {/* Monthly / Yearly toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-md">
            {[false, true].map((yearly) => (
              <button
                key={String(yearly)}
                onClick={() => setIsYearly(yearly)}
                className={`relative rounded-xl px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                  isYearly === yearly ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isYearly === yearly && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-xl bg-white/[0.1]"
                    transition={{ type: "spring", stiffness: 400, damping: 38 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {yearly ? "Yıllık" : "Aylık"}
                  {yearly && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      −21%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const c = colorMap[plan.color];
            const isPro = plan.id === "pro";
            const isEnt = plan.id === "enterprise";
            const loading = isLoading === plan.id;
            const displayPrice = isYearly ? plan.yearlyPrice : plan.price;

            return (
              <motion.article
                key={plan.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                whileHover={{ y: isPro ? -8 : -4, transition: { duration: 0.22 } }}
                className={`relative flex flex-col rounded-2xl border bg-white/[0.02] p-6 backdrop-blur-md ${c.border} ${c.ring} ${c.glow}`}
              >
                {/* Top glow line for Pro */}
                {isPro && (
                  <div className="absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300 shadow-lg shadow-emerald-500/20 backdrop-blur-sm">
                      <span>✦</span> {plan.badge}
                    </span>
                  </div>
                )}

                {/* Label */}
                <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${c.label}`}>
                  {plan.label}
                </p>

                {/* Price */}
                <div className="mt-3 flex items-end gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={displayPrice}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.18 }}
                      className="text-4xl font-bold tracking-tight text-white"
                    >
                      {displayPrice}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{plan.credits}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{plan.desc}</p>

                {isYearly && plan.price !== "$0" && plan.price !== "Custom" && (
                  <p className="mt-1 text-[11px] text-emerald-500/70">yıllık faturalandırılır</p>
                )}

                <div className="my-5 h-px bg-white/[0.05]" />

                {/* Features */}
                <ul className="flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-[1px] flex-shrink-0 text-sm leading-5 ${c.dot}`}>✓</span>
                      <span className="text-sm text-zinc-400">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={
                    isPro ? () => void onCheckout("pro")
                    : isEnt ? () => void onCheckout("enterprise")
                    : undefined
                  }
                  disabled={(isPro || isEnt) && isLoading !== null}
                  className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isPro
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/25 hover:brightness-110 hover:shadow-emerald-500/40"
                      : isEnt
                      ? "border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20"
                      : "cursor-default border border-zinc-800 bg-zinc-900/50 text-zinc-500"
                  }`}
                >
                  {loading ? tp.loading : plan.btn}
                </motion.button>
              </motion.article>
            );
          })}
        </div>

        {/* Compare toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <button
            onClick={() => setShowCompare((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-2.5 text-sm text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-200"
          >
            <motion.span
              animate={{ rotate: showCompare ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-xs"
            >
              ▼
            </motion.span>
            {showCompare ? "Karşılaştırmayı Gizle" : "Tüm Özellikleri Karşılaştır"}
          </button>
        </motion.div>

        {/* Comparison table */}
        <AnimatePresence>
          {showCompare && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600 w-[40%]">
                        Özellik
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        Free
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-emerald-400 relative">
                        <span className="relative">
                          Pro
                          <span className="absolute -top-1 -right-2 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        </span>
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map((row, idx) => {
                      if (row.type === "group") {
                        return (
                          <tr key={idx} className="border-t border-white/[0.04]">
                            <td colSpan={4} className="px-5 pt-5 pb-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                                {row.label}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr
                          key={idx}
                          className="border-t border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-3 text-zinc-400">{row.label}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center"><Cell val={row.free} /></div>
                          </td>
                          <td className="px-4 py-3 text-center bg-emerald-500/[0.03]">
                            <div className="flex justify-center"><Cell val={row.pro} /></div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center"><Cell val={row.enterprise} /></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-1.5 text-emerald-400">
            <span>🔒</span> {tp.pill1}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-zinc-500">
            <span>↩</span> {tp.pill2}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-zinc-500">
            <span>⚡</span> Kredi kartı gerekmez
          </span>
        </motion.div>
      </section>
    </main>
  );
}
