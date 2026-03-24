import { motion } from "framer-motion";
import { Skeleton } from "./ui/skeleton";

type IdeaSkeletonGridProps = {
  stageLabel: string;
};

export function IdeaSkeletonGrid({ stageLabel }: IdeaSkeletonGridProps) {
  const fieldLabels = ["Isim", "Problem", "Cozum", "Hedef Kitle", "Tahmini MRR"];

  return (
    <div className="mt-8">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-sm text-zinc-400"
      >
        {stageLabel}
      </motion.p>

      <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <motion.article
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.32, ease: "easeOut" }}
          className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"
        >
          <div className="mb-4 flex items-center gap-2">
            <motion.span
              className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-300"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, delay: index * 0.15 }}
            />
            <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">
              AI cooking
            </span>
          </div>

          <div className="grid gap-3">
            {fieldLabels.map((label, fieldIndex) => (
              <motion.div
                key={`${label}-${fieldIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{
                  delay: index * 0.07 + fieldIndex * 0.05,
                  duration: 1.15,
                  repeat: Number.POSITIVE_INFINITY,
                }}
                className="rounded-lg border border-zinc-800/90 bg-zinc-900/60 p-3"
              >
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                <Skeleton className="h-3 w-5/6" />
              </motion.div>
            ))}
          </div>
        </motion.article>
      ))}
      </div>
    </div>
  );
}
