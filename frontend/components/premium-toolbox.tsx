"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Code2, Map, Megaphone, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { analyzeIdea, type SaaSIdea, type ToolType } from "../lib/mcp";
import { useLanguage } from "../contexts/language-context";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  marketing:  <Megaphone size={16} strokeWidth={1.75} />,
  tech_stack: <Code2    size={16} strokeWidth={1.75} />,
  competitor: <Swords   size={16} strokeWidth={1.75} />,
  roadmap:    <Map      size={16} strokeWidth={1.75} />,
};

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="mt-4 mb-1 text-sm font-semibold text-emerald-300">{line.slice(4).replace(/\*\*/g, "")}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="mt-5 mb-1 text-base font-bold text-white">{line.slice(3).replace(/\*\*/g, "")}</h2>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={key++} className="mt-3 mb-1 text-sm font-semibold text-zinc-200">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const text = line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1");
      elements.push(<li key={key++} className="ml-3 text-sm text-zinc-300 leading-relaxed list-disc">{text}</li>);
    } else if (line.match(/^\d+\) /)) {
      const text = line.replace(/^\d+\) /, "").replace(/\*\*(.*?)\*\*/g, "$1");
      const num = line.match(/^(\d+)/)?.[1];
      elements.push(
        <div key={key++} className="flex gap-2 mt-2 text-sm text-zinc-300 leading-relaxed">
          <span className="flex-shrink-0 font-semibold text-emerald-400">{num}.</span>
          <span>{text}</span>
        </div>
      );
    } else if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={key++} className="my-3 border-white/[0.06]" />);
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      elements.push(<p key={key++} className="text-sm text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />);
    }
  }

  return <>{elements}</>;
}


interface PremiumToolboxProps {
  idea: SaaSIdea;
  plan: string;
}

export function PremiumToolbox({ idea, plan }: PremiumToolboxProps) {
  const isPro = plan === "pro" || plan === "enterprise";
  const router = useRouter();
  const { t, lang } = useLanguage();
  const TOOLS = t.toolbox.tools;
  const [activeResult, setActiveResult] = useState<{ tool: ToolType; content: string } | null>(null);
  const [loadingTool, setLoadingTool] = useState<ToolType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsCache, setResultsCache] = useState<Record<string, string>>({});

  const handleTool = async (tool: ToolType) => {
    if (!isPro) {
      router.push("/pricing");
      return;
    }

    if (activeResult?.tool === tool) {
      setActiveResult(null);
      return;
    }

    if (resultsCache[tool]) {
      setActiveResult({ tool, content: resultsCache[tool] });
      return;
    }

    setLoadingTool(tool);
    setError(null);
    setActiveResult(null);

    try {
      const result = await analyzeIdea(idea, tool, lang);
      setResultsCache(prev => ({ ...prev, [tool]: result }));
      setActiveResult({ tool, content: result });
    } catch {
      setError(t.toolbox.error);
    } finally {
      setLoadingTool(null);
    }
  };

  const activeToolMeta = TOOLS.find((t) => t.id === activeResult?.tool);

  return (
    <div className="mt-6">
      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TOOLS.map((tool) => {
          const isActive = activeResult?.tool === tool.id;
          const isLoading = loadingTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => void handleTool(tool.id)}
              disabled={loadingTool !== null && !isLoading}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50
                ${isActive
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-zinc-200"
                }`}
            >
              {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-200" />
              ) : (
                TOOL_ICONS[tool.id]
              )}
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {activeResult && (
          <motion.div
            key={activeResult.tool}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 rounded-xl border border-white/[0.07] bg-zinc-950/60 p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-zinc-500">{activeToolMeta ? TOOL_ICONS[activeToolMeta.id] : null}</span>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {activeToolMeta?.label}
              </p>
              <button
                type="button"
                onClick={() => setActiveResult(null)}
                className="ml-auto text-xs text-zinc-700 transition hover:text-zinc-400"
              >
                ✕
              </button>
            </div>
            <div className="space-y-0.5">
              <MarkdownContent content={activeResult.content} />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
