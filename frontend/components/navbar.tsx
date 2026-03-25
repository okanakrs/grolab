"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchCredits, type CreditStatus } from "../lib/mcp";
import { useLanguage } from "../contexts/language-context";
import { createClient } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [credits, setCredits] = useState<CreditStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const supabase = createClient();

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

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    void getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navLinks = [
    { label: t.nav.howItWorks, href: "/how-it-works" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.pricing, href: "/pricing" },
  ];

  const userDisplayName = user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split("@")[0]
    ?? null;

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/[0.07] bg-black/50 px-5 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-black shadow-lg shadow-emerald-500/30 transition group-hover:shadow-emerald-500/50">
            <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition group-hover:opacity-100" />
            G
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-white">GroLab</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-emerald-400/70">AI Research</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-white/[0.08]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="flex items-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
            <button
              onClick={() => setLang("tr")}
              className={`px-3 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200 ${
                lang === "tr" ? "bg-white/[0.12] text-white" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              TR
            </button>
            <div className="h-3.5 w-px bg-white/[0.07]" />
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200 ${
                lang === "en" ? "bg-white/[0.12] text-white" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              EN
            </button>
          </div>

          {/* Credit badge */}
          {credits && (
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-1.5 sm:flex">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-emerald-300">
                {credits.credits_remaining}
                <span className="text-emerald-500/70">/{credits.credits_total}</span>
              </span>
              <span className="text-[11px] text-emerald-500/60">{t.nav.credits}</span>
            </div>
          )}

          {/* Auth area */}
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-black">
                  {(userDisplayName?.[0] ?? "U").toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate text-[12px] font-medium text-zinc-300">
                  {userDisplayName}
                </span>
              </div>
              <button
                onClick={() => void onSignOut()}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-zinc-500 transition hover:border-white/[0.12] hover:text-zinc-300"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white sm:block"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/pricing"
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-[13px] font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110 hover:shadow-emerald-500/40"
              >
                <span className="relative z-10">{t.nav.upgrade}</span>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.07] hover:text-white md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t.nav.openMenu}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm leading-none"
              >
                {menuOpen ? "✕" : "☰"}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-2 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/[0.08] bg-black/80 p-2 shadow-2xl backdrop-blur-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  pathname === link.href
                    ? "bg-white/[0.07] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${pathname === link.href ? "bg-emerald-400" : "bg-zinc-700"}`} />
                {link.label}
              </Link>
            ))}
            <div className="mx-2 my-2 h-px bg-white/[0.05]" />
            {user ? (
              <button
                onClick={() => { void onSignOut(); setMenuOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                Çıkış Yap
              </button>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                {t.nav.signIn}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
