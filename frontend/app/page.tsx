"use client";

import { motion, type Variants } from "framer-motion";
import { Navbar } from "../components/navbar";
import { Hero } from "../components/hero";
import { useLanguage } from "../contexts/language-context";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.08 },
  }),
};

export default function HomePage() {
  const { t } = useLanguage();
  const tf = t.features;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Animated ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="animate-blob absolute left-[-22rem] top-[-16rem] h-[50rem] w-[50rem] rounded-full bg-emerald-500/[0.08] blur-[140px]" />
        <div className="animate-blob-reverse absolute bottom-[-14rem] right-[-20rem] h-[44rem] w-[44rem] rounded-full bg-indigo-500/[0.07] blur-[140px]" />
        <div className="animate-blob-slow absolute left-1/2 top-[35%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-teal-500/[0.05] blur-[120px]" />
      </div>

      <Navbar />
      <Hero />

      {/* Features section */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-28 sm:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
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
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tf.items.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04]"
            >
              {/* Card glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle at 50% 0%, rgb(52 211 153 / 0.06), transparent 70%)" }}
              />
              <span className="text-2xl leading-none">{feature.icon}</span>
              <h3 className="mt-4 text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-8 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-lg font-semibold text-white">{tf.cta.title}</p>
          <p className="max-w-sm text-sm text-zinc-500">{tf.cta.subtitle}</p>
          <motion.a
            href="#idea-topic"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            {tf.cta.btn}
          </motion.a>
        </motion.div>
      </section>
    </main>
  );
}
