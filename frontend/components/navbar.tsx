"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, Crown, LogOut, Zap } from "lucide-react";
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
      if (!user) {
        setCredits(null);
        return;
      }
      try {
        const snapshot = await fetchCredits();
        setCredits(snapshot);
      } catch {
        setCredits(null);
      }
    };
    void loadCredits();

    const handler = () => { void loadCredits(); };
    window.addEventListener("credits-updated", handler);
    return () => window.removeEventListener("credits-updated", handler);
  }, [user]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User } | null) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

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
        className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/[0.09] bg-black/60 px-5 py-3 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.95),inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-2xl"
      >
        {/* Logo */}
        <Link href="/" className="group flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-white transition group-hover:text-zinc-200">GroLab</span>
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-emerald-400/70 transition group-hover:text-emerald-400">AI Research</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3.5 py-2 text-[13px] font-medium"
              >
                <motion.span
                  animate={{
                    color: isActive ? "#ffffff" : "#71717a",
                    textShadow: isActive ? "0 0 20px rgb(52 211 153 / 0.5)" : "none",
                  }}
                  whileHover={{ color: "#e4e4e7" }}
                  transition={{ duration: 0.25 }}
                  className="relative block"
                >
                  {link.label}
                </motion.span>

                {/* Underline that grows from center */}
                <motion.span
                  className="absolute bottom-0.5 left-1/2 block h-px rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  initial={false}
                  animate={{
                    width: isActive ? "60%" : "0%",
                    x: "-50%",
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
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

          {/* Credit indicator */}
          {credits && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Zap size={12} className="text-teal-400" strokeWidth={2} />
              <span className="text-[12px] font-semibold tabular-nums text-teal-300">
                {credits.credits_remaining}
              </span>
              <span className="text-[12px] text-zinc-600">/{credits.credits_total}</span>
              {credits.plan === "free" && (
                <div className="group relative ml-0.5">
                  <Link href="/pricing" className="flex items-center text-amber-400 transition hover:text-amber-300">
                    <Crown size={16} strokeWidth={1.75} />
                  </Link>
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    {t.nav.upgrade}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Auth area */}
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              {/* Upgrade button removed — Crown icon used instead */}
              {/* Dashboard icon link with tooltip */}
              <div className="group relative">
                <Link
                  href="/dashboard"
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                    pathname === "/dashboard"
                      ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300"
                      : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300"
                  }`}
                >
                  <BookMarked size={15} strokeWidth={1.75} />
                </Link>
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  {t.nav.myIdeas}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-teal-500/40 bg-zinc-900 text-[11px] font-bold text-teal-300">
                {(userDisplayName?.[0] ?? "U").toUpperCase()}
              </div>

              {/* Sign out */}
              <button
                onClick={() => void onSignOut()}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/[0.08] hover:text-red-400"
                title={t.nav.signOut}
              >
                <LogOut size={15} strokeWidth={1.75} />
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
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    pathname === "/dashboard"
                      ? "bg-emerald-500/[0.07] text-emerald-300"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${pathname === "/dashboard" ? "bg-emerald-400" : "bg-zinc-700"}`} />
                  Fikirlerim
                </Link>
                <button
                  onClick={() => { void onSignOut(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                  {t.nav.signOutMobile}
                </button>
              </>
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
