"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "../../components/navbar";
import { useLanguage } from "../../contexts/language-context";
import { createClient } from "../../lib/supabase";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any;
  }
}

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

const colorMap = {
  zinc:    { border: "border-white/[0.07]",    ring: "",                          dot: "text-zinc-500",    label: "text-zinc-400",    glow: "" },
  emerald: { border: "border-emerald-500/40",  ring: "ring-1 ring-emerald-500/20", dot: "text-emerald-400", label: "text-emerald-300",  glow: "shadow-[0_0_80px_-20px_rgba(16,185,129,0.45)]" },
  indigo:  { border: "border-indigo-500/25",   ring: "",                          dot: "text-indigo-400",  label: "text-indigo-300",   glow: "" },
};

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<"pro" | "enterprise" | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [showCompare, setShowCompare] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const paddleReady = useRef(false);
  const { t } = useLanguage();
  const tp = t.pricing;

  // Load Paddle.js and initialize with eventCallback (v2 API)
  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!clientToken || paddleReady.current) return;

    const init = () => {
      if (!window.Paddle) return;
      if (process.env.NEXT_PUBLIC_PADDLE_ENV !== "production") {
        window.Paddle.Environment.set("sandbox");
      }
      window.Paddle.Initialize({
        token: clientToken,
        eventCallback: (event: { name: string }) => {
          if (event.name === "checkout.completed") {
            setIsLoading(null);
            window.location.href = "/pricing?checkout=success";
          }
          if (event.name === "checkout.closed") {
            setIsLoading(null);
          }
          if (event.name === "checkout.error") {
            setIsLoading(null);
          }
        },
      });
      paddleReady.current = true;
    };

    if (window.Paddle) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  // Get current user ID for custom_data
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const onCheckout = (plan: "pro" | "enterprise") => {
    const priceId =
      plan === "pro"
        ? (isYearly ? process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY : process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO)
        : (isYearly ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_YEARLY : process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE);

    if (!priceId || !window.Paddle) {
      console.error("Paddle not ready or price ID missing", { priceId, paddle: !!window.Paddle });
      return;
    }

    setIsLoading(plan);

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(userId ? { customData: { user_id: userId } } : {}),
      settings: {
        displayMode: "overlay",
        theme: "dark",
        locale: "en",
      },
    });
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
            {([false, true] as const).map((yearly) => (
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
                  {yearly ? tp.toggleYearly : tp.toggleMonthly}
                  {yearly && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      −{Math.round(YEARLY_DISCOUNT * 100)}%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tp.plans.map((plan, i) => {
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
                {"badge" in plan && plan.badge && (
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
                  <p className="mt-1 text-[11px] text-emerald-500/70">{tp.yearlyBilled}</p>
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
                    isPro ? () => onCheckout("pro")
                    : isEnt ? () => onCheckout("enterprise")
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
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {tp.loading}
                    </span>
                  ) : plan.btn}
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
            {showCompare ? tp.compareHide : tp.compareShow}
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
                        {tp.tableFeatureCol}
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
                    {tp.compareRows.map((row, idx) => {
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
          className="mt-10 flex flex-wrap items-center justify-center gap-2 text-[12px]"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-1.5 text-emerald-400/80">
            <ShieldCheck size={13} strokeWidth={2} /> {tp.pill1}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 px-3.5 py-1.5 text-zinc-500">
            <RotateCcw size={13} strokeWidth={2} /> {tp.pill2}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 px-3.5 py-1.5 text-zinc-500">
            <Zap size={13} strokeWidth={2} /> {tp.pill3}
          </span>
        </motion.div>
      </section>
    </main>
  );
}
