"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { Navbar } from "../../../components/navbar";
import { useLanguage } from "../../../contexts/language-context";
import { blogContent } from "../../../lib/blog-content";

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

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { t, lang } = useLanguage();
  const tb = t.blog;

  const post =
    slug === tb.featuredPost.slug
      ? { ...tb.featuredPost }
      : tb.posts.find((p) => p.slug === slug) ?? null;

  useEffect(() => {
    if (!post) {
      router.replace("/blog");
    }
  }, [post, router]);

  if (!post) return null;

  const content = blogContent[slug]?.[lang] ?? null;

  return (
    <>
      <title>{post.title} | GroLab Blog</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:type" content="article" />
      <meta name="robots" content="index, follow" />

      <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-[-20rem] top-[-15rem] h-[40rem] w-[40rem] rounded-full bg-emerald-500/[0.06] blur-[130px]" />
          <div className="absolute bottom-[-10rem] right-[-15rem] h-[35rem] w-[35rem] rounded-full bg-indigo-500/[0.06] blur-[130px]" />
        </div>

        <Navbar />

        <div className="mx-auto max-w-3xl px-4 pb-28 pt-14 sm:px-8 sm:pt-20">
          {/* Back link */}
          <Link
            href="/blog"
            className="mb-10 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-emerald-400"
          >
            ← {t.nav.blog}
          </Link>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                CATEGORY_COLORS[post.category] ??
                "border-zinc-700 bg-zinc-800 text-zinc-400"
              }`}
            >
              {post.category}
            </span>
            <span className="text-xs text-zinc-600">
              {post.readTime} {tb.readTime}
            </span>
            <span className="text-xs text-zinc-700">{post.date}</span>
          </div>

          {/* Title */}
          <h1 className="mt-5 text-3xl font-bold leading-snug tracking-[-0.02em] text-white sm:text-4xl">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="mt-5 text-base leading-relaxed text-zinc-400">
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-0.5 text-[11px] text-zinc-500"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="my-10 border-t border-white/[0.06]" />

          {/* Article content */}
          {content ? (
            <article className="space-y-8">
              {content.sections.map((section, i) => (
                <section key={i}>
                  {section.heading && (
                    <h2 className="mb-4 text-xl font-bold text-white">
                      {section.heading}
                    </h2>
                  )}
                  <div className="space-y-4">
                    {section.body.map((paragraph, j) => (
                      <p key={j} className="text-base leading-relaxed text-zinc-400">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </article>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center">
              <p className="text-sm text-zinc-500">
                {lang === "tr" ? "İçerik yakında eklenecek." : "Content coming soon."}
              </p>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-16 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-8 text-center">
            <h2 className="text-lg font-bold text-white">
              {lang === "tr" ? "Kendi SaaS fikrinizi üretin" : "Generate your own SaaS idea"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {lang === "tr"
                ? "Google Trends, Product Hunt ve Reddit verisiyle doğrulanmış fikirler."
                : "Ideas validated with Google Trends, Product Hunt, and Reddit data."}
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
            >
              {lang === "tr" ? "AI ile Üret →" : "Generate with AI →"}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
