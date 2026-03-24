"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCredits, type CreditStatus } from "../lib/mcp";

export function Navbar() {
  const [credits, setCredits] = useState<CreditStatus | null>(null);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const snapshot = await fetchCredits();
        setCredits(snapshot);
      } catch {
        setCredits(null);
      }
    };

    void loadCredits();
  }, []);

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8">
      <motion.nav
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-xl border border-white/20 bg-white/10 px-5 py-3 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          GroLab
        </Link>

        <div className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <Link href="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <a href="#mcp" className="transition hover:text-white">
            MCP Ready
          </a>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            {credits
              ? `⚡ ${credits.credits_remaining}/${credits.credits_total} Credits`
              : "⚡ Credits"}
          </span>
          <Link
            href="/pricing"
            className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
          >
            Upgrade
          </Link>
        </div>
      </motion.nav>
    </header>
  );
}
