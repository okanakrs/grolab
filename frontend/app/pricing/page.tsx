"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useState } from "react";
import { Navbar } from "../../components/navbar";
import { createCheckout } from "../../lib/mcp";
import { useLanguage } from "../../contexts/language-context";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const YEARLY_DISCOUNT = 0.21; // 21% off

function yearlyPrice(monthly: string): string {
  if (monthly === "$0" || monthly === "Custom") return monthly;
  const num = parseFloat(monthly.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return monthly;
  return `$${Math.round(num * (1 - YEARLY_DISCOUNT))}/mo`;
}

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<"pro" | "enterprise" | null>(null);
  const [isYearly, setIsYearly] = useState(false);
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

  const colorMap = {
    zinc: {
      border: "border-zinc-800/60",
      glow: "",
      feature: "border-zinc-800/80 bg-zinc-900/40",
      dot: "text-zinc-500",
      label: "text-zinc-400",
    },
    emerald: {
      border: "border-emerald-500/50",
      glow: "shadow-[0_0_60px_-15px_rgba(16,185,129,0.5)]",
      feature: "border-emerald-500/20 bg-emerald-500/[0.06]",
      dot: "text-emerald-400",
      label: "text-emerald-300",
    },
    indigo: {
      border: "border-indigo-500/30",
      glow: "",
      feature: "border-indigo-500/20 bg-indigo-500/[0.06]",
      dot: "text-indigo-400",
      label: "text-indigo-300",
    },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20rem] top-[-15rem] h-[50rem] w-[50rem] rounded-full bg-emerald-500/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-10rem] right-[-15rem] h-[40rem] w-[40rem] rounded-full bg-indigo-500/[0.06] blur-[140px]" />
        <div className="absolute left-1/2 top-1/3 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-8">
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            {tp.badge}
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              {tp.title}
            </span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-zinc-500">{tp.subtitle}</p>

          {/* Monthly / Yearly toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur-md">
            <button
              onClick={() => setIsYearly(false)}
              className={`relative rounded-xl px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                !isYearly ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {!isYearly && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 rounded-xl bg-white/[0.1]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative">Monthly</span>
            </button>

            <button
              onClick={() => setIsYearly(true)}
              className={`relative rounded-xl px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                isYearly ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {isYearly && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 rounded-xl bg-white/[0.1]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                Yearly
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  −21%
                </span>
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-12 grid gap-8 md:grid-cols-3"
        >
          {tp.plans.map((plan) => {
            const c = colorMap[plan.color];
            const isPro = plan.id === "pro";
            const isEnt = plan.id === "enterprise";
            const loading = isLoading === plan.id;
            const displayPrice = isYearly ? yearlyPrice(plan.price) : plan.price;

            return (
              <motion.article
                key={plan.id}
                variants={cardVariants}
                whileHover={{ y: isPro ? -10 : -6, transition: { duration: 0.25 } }}
                className={`relative flex flex-col rounded-2xl border bg-white/[0.03] p-6 backdrop-blur-md ${c.border} ${c.glow}`}
              >
                {/* Best Value badge */}
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-300 shadow-lg shadow-emerald-500/20 backdrop-blur-sm">
                      <span className="text-emerald-400">✦</span>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan label & price */}
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${c.label}`}>
                  {plan.label}
                </p>

                <div className="mt-3 flex items-end gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={displayPrice}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="text-4xl font-bold tracking-tight text-white"
                    >
                      {displayPrice}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <p className="mt-1.5 text-sm text-zinc-600">{plan.credits}</p>

                {isYearly && plan.price !== "$0" && plan.price !== "Custom" && (
                  <p className="mt-1 text-xs text-emerald-500/70">
                    billed annually
                  </p>
                )}

                {/* Divider */}
                <div className="my-5 h-px bg-white/[0.05]" />

                {/* Features */}
                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${c.feature}`}>
                      <span className={`mt-[1px] flex-shrink-0 text-base leading-none ${c.dot}`}>✓</span>
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={
                    isPro ? () => void onCheckout("pro")
                    : isEnt ? () => void onCheckout("enterprise")
                    : undefined
                  }
                  disabled={(isPro || isEnt) && isLoading !== null}
                  className={`mt-6 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isPro
                      ? "border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-100 hover:from-emerald-500/30 hover:to-teal-500/30"
                      : isEnt
                      ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20"
                      : "cursor-default border-zinc-800 bg-zinc-900/50 text-zinc-500"
                  }`}
                >
                  {loading ? tp.loading : plan.btn}
                </motion.button>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Bottom pills */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs"
        >
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-1.5 text-emerald-400">
            {tp.pill1}
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-zinc-500">
            {tp.pill2}
          </span>
        </motion.div>
      </section>
    </main>
  );
}
