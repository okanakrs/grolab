"use client";

import Link from "next/link";
import { useLanguage } from "../contexts/language-context";

export function Footer() {
  const { t } = useLanguage();
  const tf = t.footer;

  return (
    <footer className="border-t border-white/[0.04] py-8 text-center">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-700">
        <span>© {new Date().getFullYear()} GroLab. {tf.rights}</span>
        <span className="text-zinc-800">·</span>
        <Link href="/privacy" className="transition hover:text-zinc-400">{tf.privacy}</Link>
        <span className="text-zinc-800">·</span>
        <Link href="/terms" className="transition hover:text-zinc-400">{tf.terms}</Link>
      </div>
    </footer>
  );
}
