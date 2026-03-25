"use client";

import Link from "next/link";
import { Navbar } from "../../components/navbar";
import { useLanguage } from "../../contexts/language-context";

const colorMap: Record<string, { badge: string; dot: string; glow: string }> = {
  emerald: {
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    glow: "from-emerald-500/10",
  },
  blue: {
    badge: "border-blue-500/25 bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400",
    glow: "from-blue-500/10",
  },
  orange: {
    badge: "border-orange-500/25 bg-orange-500/10 text-orange-400",
    dot: "bg-orange-400",
    glow: "from-orange-500/10",
  },
  red: {
    badge: "border-red-500/25 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
    glow: "from-red-500/10",
  },
  indigo: {
    badge: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
    dot: "bg-indigo-400",
    glow: "from-indigo-500/10",
  },
  teal: {
    badge: "border-teal-500/25 bg-teal-500/10 text-teal-400",
    dot: "bg-teal-400",
    glow: "from-teal-500/10",
  },
};

export default function HowItWorksPage() {
  const { t } = useLanguage();
  const th = t.howItWorks;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20rem] top-[-15rem] h-[40rem] w-[40rem] rounded-full bg-emerald-500/[0.06] blur-[130px]" />
        <div className="absolute bottom-[-10rem] right-[-15rem] h-[35rem] w-[35rem] rounded-full bg-indigo-500/[0.06] blur-[130px]" />
      </div>

      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-14 sm:px-8 sm:pt-20">
        {/* Header */}
        <div className="mb-16 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {th.badge}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-[-0.025em] text-white sm:text-5xl">
            {th.title1}{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              {th.titleHighlight}
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-zinc-500">{th.subtitle}</p>

          <div className="mt-8 flex flex-wrap gap-5">
            {th.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span className="text-xs text-zinc-600">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-5">
          {th.steps.map((step, index) => {
            const c = colorMap[step.color] ?? colorMap.emerald;
            return (
              <article
                key={step.number}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition hover:border-white/[0.1] sm:p-8"
              >
                <div
                  className={`pointer-events-none absolute right-0 top-0 h-40 w-40 bg-gradient-to-bl ${c.glow} to-transparent opacity-0 transition group-hover:opacity-100`}
                />

                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="flex-shrink-0">
                    <span className="font-mono text-4xl font-bold text-zinc-800">
                      {step.number}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xl leading-none">{step.icon}</span>
                      <h2 className="text-lg font-bold text-white">{step.title}</h2>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${c.badge}`}>
                        {step.subtitle}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{step.description}</p>

                    <ul className="mt-4 space-y-2">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.dot}`} />
                          <span className="text-xs leading-relaxed text-zinc-500">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {index < th.steps.length - 1 && (
                  <div className="mt-6 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                )}
              </article>
            );
          })}
        </div>

        {/* Technical architecture */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-white">{th.architecture.title}</h2>
          <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {th.architecture.layers.map((layer) => (
                <div key={layer.layer} className={`rounded-xl border p-4 ${layer.color}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {layer.layer}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-white">{layer.tech}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">{layer.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-2 text-2xl font-bold text-white">{th.faq.title}</h2>
          <p className="mb-8 text-sm text-zinc-600">
            {th.faq.subtitle}{" "}
            <Link href="/blog" className="text-emerald-400 hover:underline">
              {th.faq.subtitleLink}
            </Link>
            {th.faq.subtitleSuffix}
          </p>
          <div className="space-y-3">
            {th.faq.items.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] open:border-white/[0.1]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium text-zinc-200 hover:text-white">
                  {faq.q}
                  <span className="ml-4 flex-shrink-0 text-zinc-600 transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-10 text-center">
          <h2 className="text-2xl font-bold text-white">{th.cta.title}</h2>
          <p className="max-w-sm text-sm text-zinc-500">{th.cta.subtitle}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
            >
              {th.cta.btn1}
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
            >
              {th.cta.btn2}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
