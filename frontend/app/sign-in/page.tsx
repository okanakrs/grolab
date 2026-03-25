"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Navbar } from "../../components/navbar";
import { OAuthButtons } from "../../components/oauth-buttons";
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
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <OAuthButtons
              googleLabel={ts.googleBtn}
              githubLabel={ts.githubBtn}
              oauthLoading={oauthLoading}
              disabled={oauthLoading !== null || loading}
              onOAuth={onOAuth}
            />

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
