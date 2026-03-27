"use client";

import Link from "next/link";
import { Navbar } from "../../components/navbar";
import { useLanguage } from "../../contexts/language-context";

export default function PrivacyPage() {
  const { t } = useLanguage();
  const tp = t.privacy;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-8">
        <div className="mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            {tp.badge}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{tp.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {tp.updated}: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          {tp.sections.map((s) => (
            <div key={s.title}>
              <h2 className="mb-3 text-base font-semibold text-white">{s.title}</h2>
              {"body" in s && s.body && <p className="mb-2">{s.body}</p>}
              {"items" in s && s.items && (
                <ul className="list-disc space-y-2 pl-5">
                  {s.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/[0.05] pt-6">
          <Link href="/" className="text-sm text-zinc-600 transition hover:text-zinc-400">
            {tp.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
