"use client";

import Link from "next/link";
import { Navbar } from "../components/navbar";
import { Hero } from "../components/hero";
import { useLanguage } from "../contexts/language-context";

export default function HomePage() {
  const { t } = useLanguage();
  const tf = t.features;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20rem] top-[-15rem] h-[45rem] w-[45rem] rounded-full bg-emerald-500/[0.07] blur-[130px]" />
        <div className="absolute bottom-[-12rem] right-[-18rem] h-[40rem] w-[40rem] rounded-full bg-indigo-500/[0.07] blur-[130px]" />
        <div className="absolute left-1/2 top-[40%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-teal-500/[0.04] blur-[110px]" />
      </div>

      <Navbar />
      <Hero />

      {/* Features section */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-28 sm:px-8">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {tf.badge}
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            {tf.title1}{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              {tf.titleHighlight}
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">{tf.subtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tf.items.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              <span className="text-2xl leading-none">{feature.icon}</span>
              <h3 className="mt-4 text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-8 text-center">
          <p className="text-lg font-semibold text-white">{tf.cta.title}</p>
          <p className="max-w-sm text-sm text-zinc-500">{tf.cta.subtitle}</p>
          <a
            href="#idea-topic"
            className="mt-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            {tf.cta.btn}
          </a>
        </div>
      </section>
    </main>
  );
}
