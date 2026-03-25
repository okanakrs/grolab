"use client";

import Link from "next/link";
import { Navbar } from "../../components/navbar";
import { useLanguage } from "../../contexts/language-context";

const CATEGORY_COLORS: Record<string, string> = {
  Rehber: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  Guide: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  Analiz: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  Analysis: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  Validasyon: "border-teal-500/25 bg-teal-500/10 text-teal-400",
  Validation: "border-teal-500/25 bg-teal-500/10 text-teal-400",
  Teknik: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
  Technical: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
  Strateji: "border-purple-500/25 bg-purple-500/10 text-purple-400",
  Strategy: "border-purple-500/25 bg-purple-500/10 text-purple-400",
  "İş Modeli": "border-amber-500/25 bg-amber-500/10 text-amber-400",
  "Business Model": "border-amber-500/25 bg-amber-500/10 text-amber-400",
  Araçlar: "border-pink-500/25 bg-pink-500/10 text-pink-400",
  Tools: "border-pink-500/25 bg-pink-500/10 text-pink-400",
};

export default function BlogPage() {
  const { t } = useLanguage();
  const tb = t.blog;
  const { featuredPost, posts } = tb;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20rem] top-[-15rem] h-[40rem] w-[40rem] rounded-full bg-emerald-500/[0.06] blur-[130px]" />
        <div className="absolute bottom-[-10rem] right-[-15rem] h-[35rem] w-[35rem] rounded-full bg-indigo-500/[0.06] blur-[130px]" />
      </div>

      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-14 sm:px-8 sm:pt-20">
        {/* Header */}
        <div className="mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {tb.badge}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.025em] text-white sm:text-5xl">
            {tb.title1}{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {tb.titleHighlight}
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-zinc-500">{tb.subtitle}</p>
        </div>

        {/* Featured post */}
        <Link
          href={`/blog/${featuredPost.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
          className="group mb-10 block overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition hover:border-emerald-500/20 hover:bg-white/[0.04] sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                CATEGORY_COLORS[featuredPost.category] ?? "border-zinc-700 bg-zinc-800 text-zinc-400"
              }`}
            >
              {featuredPost.category}
            </span>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
              {tb.featuredBadge}
            </span>
            <span className="text-xs text-zinc-600">
              {featuredPost.readTime} {tb.readTime}
            </span>
            <span className="text-xs text-zinc-700">{featuredPost.date}</span>
          </div>

          <h2 className="mt-4 text-2xl font-bold leading-snug text-white transition group-hover:text-emerald-200 sm:text-3xl">
            {featuredPost.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-500">
            {featuredPost.excerpt}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {featuredPost.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-0.5 text-[11px] text-zinc-500"
              >
                #{tag}
              </span>
            ))}
            <span className="ml-auto text-xs font-medium text-emerald-400 opacity-0 transition group-hover:opacity-100">
              {tb.readMore}
            </span>
          </div>
        </Link>

        {/* Post grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    CATEGORY_COLORS[post.category] ?? "border-zinc-700 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {post.category}
                </span>
                <span className="text-[11px] text-zinc-700">
                  {post.readTime} {tb.readTime}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-semibold leading-snug text-white transition group-hover:text-emerald-200">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-zinc-600">{post.excerpt}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-800/80 bg-zinc-900/40 px-2 py-0.5 text-[10px] text-zinc-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-zinc-700">{post.date}</span>
                <span className="text-[11px] font-medium text-emerald-400 opacity-0 transition group-hover:opacity-100">
                  {tb.read}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-8 text-center">
          <h2 className="text-xl font-bold text-white">{tb.ctaTitle}</h2>
          <p className="mt-2 text-sm text-zinc-500">{tb.ctaSubtitle}</p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            {tb.ctaBtn}
          </Link>
        </div>
      </div>
    </main>
  );
}
