"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function GuestLimitModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.09] bg-zinc-950 p-8 shadow-2xl">
              {/* Top glow */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

              {/* Icon */}
              <div className="mb-5 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl ring-1 ring-emerald-500/20">
                  ✦
                </div>
              </div>

              <h2 className="text-center text-xl font-bold text-white">
                Ücretsiz hakkın doldu
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500">
                Misafir olarak 1 fikir üretme hakkın var. Devam etmek için{" "}
                <strong className="text-zinc-300">ücretsiz hesap oluştur</strong> —
                kayıt olunca <span className="text-emerald-400">10 kredi</span> hediye.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/sign-up"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
                >
                  <span>Ücretsiz Hesap Oluştur</span>
                  <span className="text-xs opacity-80">→</span>
                </Link>
                <Link
                  href="/sign-in"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-200"
                >
                  Zaten hesabım var — Giriş yap
                </Link>
                <button
                  onClick={onClose}
                  className="text-xs text-zinc-700 transition hover:text-zinc-500"
                >
                  Şimdi değil
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
