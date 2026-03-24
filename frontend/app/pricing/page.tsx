"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { Navbar } from "../../components/navbar";
import { createCheckout } from "../../lib/mcp";

const container: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<"pro" | "enterprise" | null>(null);

  const onCheckout = async (plan: "pro" | "enterprise") => {
    setIsLoading(plan);
    try {
      const checkoutUrl = await createCheckout(plan);
      window.location.href = checkoutUrl;
    } catch {
      setIsLoading(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10rem] top-[-8rem] h-[20rem] w-[20rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-8rem] h-[18rem] w-[18rem] rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      <Navbar />

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-8"
      >
        <motion.p variants={item} className="text-xs uppercase tracking-[0.18em] text-zinc-400">
          Pricing
        </motion.p>
        <motion.h1 variants={item} className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          GroLab Planlarini Sec
        </motion.h1>
        <motion.p variants={item} className="mt-4 max-w-2xl text-zinc-300">
          Kredi bazli fikir ureterek hizli iterasyon yap. Kredin biterse planini tek tikla yukselt.
        </motion.p>

        <motion.div variants={item} className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-zinc-800 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.14em] text-zinc-400">Free</p>
            <p className="mt-2 text-3xl font-semibold text-white">$0</p>
            <p className="mt-1 text-sm text-zinc-400">10 kredi / ay</p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              <li>Temel Deep Research akisi</li>
              <li>Sinirli market evidence</li>
            </ul>
          </article>

          <article className="rounded-xl border border-zinc-800 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.14em] text-emerald-300">Pro</p>
            <p className="mt-2 text-3xl font-semibold text-white">$19/mo</p>
            <p className="mt-1 text-sm text-zinc-300">100 kredi / ay</p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              <li>Gelistirilmis market sinyalleri</li>
              <li>Oncelikli fikir optimizasyonu</li>
            </ul>
            <button
              type="button"
              onClick={() => void onCheckout("pro")}
              disabled={isLoading !== null}
              className="mt-6 w-full rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading === "pro" ? "Yukleniyor..." : "Pro ile Basla"}
            </button>
          </article>

          <article className="rounded-xl border border-zinc-800 bg-white/5 p-5 backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.14em] text-indigo-300">Enterprise</p>
            <p className="mt-2 text-3xl font-semibold text-white">Custom</p>
            <p className="mt-1 text-sm text-zinc-300">1000+ kredi / ay</p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              <li>Ozel model routing</li>
              <li>Takim ve yonetim panelleri</li>
            </ul>
            <button
              type="button"
              onClick={() => void onCheckout("enterprise")}
              disabled={isLoading !== null}
              className="mt-6 w-full rounded-xl border border-indigo-300/40 bg-indigo-400/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading === "enterprise" ? "Yukleniyor..." : "Enterprise Talep Et"}
            </button>
          </article>
        </motion.div>
      </motion.section>
    </main>
  );
}
