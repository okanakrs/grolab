"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Navbar } from "../../components/navbar";
import { useLanguage } from "../../contexts/language-context";
import { createClient } from "../../lib/supabase";

export default function SignInPage() {
  const { t } = useLanguage();
  const ts = t.signIn;
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onEmailSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const onOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20rem] top-[-15rem] h-[40rem] w-[40rem] rounded-full bg-emerald-500/[0.06] blur-[130px]" />
        <div className="absolute bottom-[-10rem] right-[-15rem] h-[35rem] w-[35rem] rounded-full bg-indigo-500/[0.06] blur-[130px]" />
      </div>

      <Navbar />

      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-28 pt-20 sm:px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-xl font-bold text-black shadow-xl shadow-emerald-500/30">
          G
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">{ts.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{ts.subtitle}</p>

        <div className="mt-8 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl">
          <div className="p-6">
            {/* Error */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Social buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onOAuth("google")}
                disabled={oauthLoading !== null || loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {oauthLoading === "google" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {ts.googleBtn}
              </button>

              <button
                type="button"
                onClick={() => onOAuth("github")}
                disabled={oauthLoading !== null || loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {oauthLoading === "github" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                )}
                {ts.githubBtn}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-xs text-zinc-700">{ts.orEmail}</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  {ts.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={ts.emailPlaceholder}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  {ts.passwordLabel}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void onEmailSignIn()}
                  placeholder={ts.passwordPlaceholder}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>
              <button
                type="button"
                onClick={() => void onEmailSignIn()}
                disabled={loading || oauthLoading !== null}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />}
                {ts.submitBtn}
              </button>
            </div>
          </div>

          <div className="border-t border-white/[0.05] bg-black/20 px-6 py-4 text-center">
            <p className="text-xs text-zinc-600">
              {ts.noAccount}{" "}
              <Link href="/sign-up" className="text-emerald-400 transition hover:text-emerald-300">
                {ts.freeStart}
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-700">{ts.terms}</p>
      </div>
    </main>
  );
}
