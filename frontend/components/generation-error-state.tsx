"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";

type GenerationErrorStateProps = {
  message: string;
  requestId?: string;
  onRetry: () => void;
};

export function GenerationErrorState({ message, requestId, onRetry }: GenerationErrorStateProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-xl border border-rose-300/20 bg-rose-950/20 p-5 shadow-soft"
    >
      <p className="text-sm font-medium text-rose-200">Uretim sirasinda bir sorun olustu</p>
      <p className="mt-2 text-sm text-zinc-300">{message}</p>
      {requestId ? (
        <p className="mt-2 text-xs text-zinc-500">Request ID: {requestId}</p>
      ) : null}

      <div className="mt-4">
        <Button onClick={onRetry} className="px-5 py-2 text-sm">
          Tekrar Dene
        </Button>
      </div>
    </motion.section>
  );
}
