import { motion, type Variants } from "framer-motion";

type DeepResearchProgressProps = {
  activeStepIndex: number;
};

const STEPS = [
  "Google Trends verileri analiz ediliyor... (SerpApi baglantisi uzerinden)",
  "Product Hunt pazar bosluklari taraniyor... (Algolia verileri isleniyor)",
  "Claude 3.5 Sonnet ile SaaS konsepti optimize ediliyor...",
];

const ICONS = ["🔍", "🚀", "🧠"];

const listVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export function DeepResearchProgress({ activeStepIndex }: DeepResearchProgressProps) {
  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={listVariants}
      className="mt-7 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-300">Live Progress</p>

      <motion.ul variants={listVariants} className="mt-3 grid gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const isActive = index === activeStepIndex;

          return (
            <motion.li
              key={step}
              variants={itemVariants}
              className={[
                "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                isActive
                  ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-100"
                  : "border-zinc-800/80 bg-zinc-950/60 text-zinc-300",
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <span>{ICONS[index]}</span>
                <span>{step}</span>
              </span>

              <span className="ml-3 inline-flex min-w-6 justify-end">
                {isCompleted ? (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="text-emerald-300"
                  >
                    ✅
                  </motion.span>
                ) : isActive ? (
                  <motion.span
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    className="text-emerald-300"
                  >
                    •
                  </motion.span>
                ) : (
                  <span className="text-zinc-600">○</span>
                )}
              </span>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.section>
  );
}
