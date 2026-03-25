"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/language-context";

type GenerationErrorStateProps = {
  message: string;
  requestId?: string;
  onRetry: () => void;
};

export function GenerationErrorState({ message, requestId, onRetry }: GenerationErrorStateProps) {
  const { t } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-950/20 p-5"
    >
      <p className="text-sm font-medium text-rose-200">{t.error.title}</p>
      <p className="mt-2 text-sm text-zinc-300">{message}</p>
      {requestId ? (
        <p className="mt-2 text-xs text-zinc-500">
          {t.error.requestId} {requestId}
        </p>
      ) : null}

      <div className="mt-4">
        <Button onClick={onRetry} className="px-5 py-2 text-sm">
          {t.error.retry}
        </Button>
      </div>
    </motion.section>
  );
}
