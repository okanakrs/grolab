import { motion } from "framer-motion";
import { useLanguage } from "../contexts/language-context";

type DeepResearchProgressProps = {
  activeStepIndex: number;
};

export function DeepResearchProgress({ activeStepIndex }: DeepResearchProgressProps) {
  const { t } = useLanguage();
  const { steps, title } = t.progress;
  const ICONS = ["📈", "🚀", "🧠"];
  const progress = Math.round(((activeStepIndex + 1) / steps.length) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-7 rounded-2xl border border-white/[0.07] bg-black/40 p-5 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {title}
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
        {steps.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const isActive = index === activeStepIndex;

          return (
            <motion.li
              key={step.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.08 }}
              className={[
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                isActive
                  ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                  : isCompleted
                  ? "border-zinc-800/60 bg-zinc-900/30"
                  : "border-zinc-800/40 bg-zinc-950/30",
              ].join(" ")}
            >
              <span className="text-base leading-none">{ICONS[index]}</span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-emerald-200"
                      : isCompleted
                      ? "text-zinc-500"
                      : "text-zinc-700"
                  }`}
                >
                  {step.label}
                </p>
                <p className="truncate text-[11px] text-zinc-700">{step.sub}</p>
              </div>

              <span className="ml-2 flex-shrink-0">
                {isCompleted ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400"
                  >
                    ✓
                  </motion.span>
                ) : isActive ? (
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
          );
        })}
      </ul>
    </motion.section>
  );
}
