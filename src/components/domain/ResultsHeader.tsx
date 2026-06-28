"use client";

import { ArrowLeft, RefreshCcw } from "lucide-react";
import type { GeneratePhase } from "@/hooks/use-generate";
import type { DomainSuggestion } from "@/types/domain";

// ─── Phase label map ──────────────────────────────────────────────────────────

const PHASE_LABELS: Record<GeneratePhase, string> = {
  idle:       "Ready",
  generating: "Generating names…",
  checking:   "Checking availability…",
  done:       "Done",
  error:      "Generation failed",
};

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ phase }: { phase: GeneratePhase }) {
  if (phase === "generating" || phase === "checking") {
    return <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />;
  }
  if (phase === "error") {
    return <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />;
  }
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResultsHeaderProps {
  /** The business description the user submitted */
  description: string | null;
  /** Current generation phase */
  phase: GeneratePhase;
  /** Full suggestions list — used to count available domains */
  suggestions: DomainSuggestion[];
  /** Navigate back to the landing page */
  onBack: () => void;
  /** Retry the generation call */
  onRetry?: () => void;
}

/**
 * ResultsHeader — context bar shown on the /generate results page.
 *
 * design.md spec:
 *   bg: zinc-950 (solid black — creates hard contrast with main nav above)
 *   border-bottom: 1px solid zinc-800
 *   sticky: top-14 (sits directly below the 56px nav header)
 *   typography: Geist text-sm / text-xs, JetBrains Mono for counts
 *
 * Layout (left → right):
 *   [← New search]  |  "description text…"  |  ● Phase label · X / N available  [Retry?]
 */
export function ResultsHeader({
  description,
  phase,
  suggestions,
  onBack,
  onRetry,
}: ResultsHeaderProps) {
  const availableCount = suggestions.filter(
    (s) => s.availabilityStatus === "available"
  ).length;
  const totalCount = suggestions.length;

  const showAvailableCount = phase === "done" && totalCount > 0;
  const showRetry = phase === "error" && !!onRetry;

  return (
    <div className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl flex items-center gap-4 px-6 py-3 flex-wrap sm:flex-nowrap">

        {/* ── Back button ── */}
        <button
          onClick={onBack}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 shrink-0 group"
          title="New search"
          aria-label="New search"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
        </button>

        {/* ── Description (truncated) ── */}
        {description && (
          <p
            className="flex-1 min-w-0 text-sm text-zinc-400 truncate"
            title={description}
          >
            <span className="text-zinc-700">&ldquo;</span>
            {description}
            <span className="text-zinc-700">&rdquo;</span>
          </p>
        )}

        {/* ── Status cluster (pinned right) ── */}
        <div className="flex items-center gap-3 ml-auto shrink-0">

          {/* Phase status (hidden when done) */}
          {phase !== "done" && (
            <div className="flex items-center gap-1.5">
              <StatusDot phase={phase} />
              <span className="text-xs text-zinc-500 font-mono tracking-tight">
                {PHASE_LABELS[phase]}
              </span>
            </div>
          )}

          {/* Available count — only when done */}
          {showAvailableCount && (
            <>
              <span className="text-zinc-700 text-xs select-none">·</span>
              <span className="text-xs font-mono tracking-tight">
                <span className="text-green-400 font-semibold">{availableCount}</span>
                <span className="text-zinc-500"> / {totalCount} available</span>
              </span>
            </>
          )}

          {/* Retry — only on error */}
          {showRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 h-7 px-3 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150 active:scale-[0.98]"
            >
              <RefreshCcw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
