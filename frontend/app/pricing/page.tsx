"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { Navbar } from "../../components/navbar";
import { createCheckout } from "../../lib/mcp";
import { useLanguage } from "../../contexts/language-context";

const container: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<"pro" | "enterprise" | null>(null);
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
      border: "border-zinc-800",
      feature: "border-zinc-800/80 bg-zinc-900/45",
      dot: "text-zinc-400",
      btn: "border-zinc-700 bg-zinc-900/60 text-zinc-200 cursor-default",
    },
    emerald: {
      border: "border-emerald-300/40 shadow-[0_22px_45px_-30px_rgba(16,185,129,0.9)]",
      feature: "border-emerald-300/20 bg-emerald-400/5",
      dot: "text-emerald-300",
      btn: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-60",
    },
    indigo: {
      border: "border-zinc-800",
      feature: "border-indigo-300/20 bg-indigo-400/5",
      dot: "text-indigo-300",
      btn: "border-indigo-300/40 bg-indigo-400/10 text-indigo-100 hover:bg-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60",
    },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20rem] top-[-15rem] h-[40rem] w-[40rem] rounded-full bg-emerald-500/[0.07] blur-[130px]" />
        <div className="absolute bottom-[-10rem] right-[-15rem] h-[35rem] w-[35rem] rounded-full bg-indigo-500/[0.07] blur-[130px]" />
      </div>

      <Navbar />

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-8"
      >
        <motion.div
          variants={item}
          className="rounded-2xl border border-white/[0.08] bg-black/40 p-6 backdrop-blur-md sm:p-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {tp.badge}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {tp.title}
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">{tp.subtitle}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-emerald-300">
              {tp.pill1}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-zinc-500">
              {tp.pill2}
            </span>
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-10 grid gap-5 md:grid-cols-3">
          {tp.plans.map((plan) => {
            const c = colorMap[plan.color];
            const isPro = plan.id === "pro";
            const isEnt = plan.id === "enterprise";
            const loading = isLoading === plan.id;

            return (
              <motion.article
                key={plan.id}
                whileHover={{ y: isPro ? -8 : -6, scale: isPro ? 1.015 : 1.01 }}
                transition={{ duration: 0.25 }}
                className={`relative rounded-2xl border bg-white/[0.03] p-5 backdrop-blur-md ${c.border}`}
              >
                {isPro && (
                  <span className="absolute right-4 top-4 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-200">
                    {plan.badge}
                  </span>
                )}

                <p
                  className={`text-sm uppercase tracking-[0.14em] ${
                    isPro ? "text-emerald-300" : isEnt ? "text-indigo-300" : "text-zinc-400"
                  }`}
                >
                  {plan.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">{plan.price}</p>
                <p className="mt-1 text-sm text-zinc-400">{plan.credits}</p>

                <ul className="mt-5 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${c.feature}`}
                    >
                      <span className={`mt-[2px] ${c.dot}`}>•</span>
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={
                    isPro ? () => void onCheckout("pro")
                    : isEnt ? () => void onCheckout("enterprise")
                    : undefined
                  }
                  disabled={plan.id !== "free" && isLoading !== null}
                  className={`mt-6 w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition ${c.btn}`}
                >
                  {loading
                    ? tp.loading
                    : plan.btn}
                </button>
              </motion.article>
            );
          })}
        </motion.div>
      </motion.section>
    </main>
  );
}
