import { motion, AnimatePresence } from "framer-motion";

export type ResearchStep = {
  id: string;
  icon: string;
  label: string;
  detail?: string;
  status: "pending" | "active" | "done";
};

type Props = {
  steps: ResearchStep[];
};

export function DeepResearchProgress({ steps }: Props) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-7 rounded-2xl border border-white/[0.07] bg-black/40 p-5 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Araştırılıyor
        </p>
        <span className="font-mono text-xs text-zinc-600">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-px overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={[
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
              step.status === "active"
                ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                : step.status === "done"
                ? "border-zinc-800/60 bg-zinc-900/30"
                : "border-zinc-800/40 bg-zinc-950/30",
            ].join(" ")}
          >
            <span className="text-base leading-none">{step.icon}</span>

            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${
                step.status === "active" ? "text-emerald-200"
                : step.status === "done" ? "text-zinc-500"
                : "text-zinc-700"
              }`}>
                {step.label}
              </p>
              <AnimatePresence>
                {step.detail && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[11px] text-emerald-400/70"
                  >
                    {step.detail}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <span className="ml-2 flex-shrink-0">
              {step.status === "done" ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400"
                >
                  ✓
                </motion.span>
              ) : step.status === "active" ? (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 text-[10px] text-emerald-400"
                >
                  ●
                </motion.span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800 text-[10px] text-zinc-700">
                  ○
                </span>
              )}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
