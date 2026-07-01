"use client";

import React, { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Copy, ExternalLink, Heart, Check } from "lucide-react";
import type { DomainSuggestion } from "@/types/domain";
import { namecheapUrl } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DomainCardStackProps {
  suggestions: DomainSuggestion[];
  onSave?: (domain: DomainSuggestion) => void;
  initialDomain?: string;
  initialSaved?: string[];
}

// ─── Availability Badge ───────────────────────────────────────────────────────

function AvailabilityBadge({ status }: { status: DomainSuggestion["availabilityStatus"] }) {
  const config = {
    available: { bg: "bg-green-500/20 border-green-500/40", text: "text-green-400", label: "Available" },
    taken:     { bg: "bg-red-500/20 border-red-500/40",     text: "text-red-400",   label: "Taken" },
    premium:   { bg: "bg-orange-500/20 border-orange-500/40", text: "text-orange-400", label: "Premium" },
    parked:    { bg: "bg-amber-500/20 border-amber-500/40", text: "text-amber-400", label: "Parked" },
    unverified:{ bg: "bg-yellow-500/20 border-yellow-500/40", text: "text-yellow-400", label: "Unverified" },
    unknown:   { bg: "bg-gray-500/20 border-gray-500/40",   text: "text-gray-400",  label: "Unknown" },
    checking:  { bg: "bg-gray-500/20 border-gray-500/40",   text: "text-gray-400",  label: "Checking…" },
  }[status] ?? { bg: "bg-gray-500/20 border-gray-500/40", text: "text-gray-400", label: "Unknown" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === "available" ? "bg-green-400 animate-pulse" :
        status === "taken"     ? "bg-red-400" :
        status === "premium"   ? "bg-orange-400" : "bg-gray-500"
      }`} />
      {config.label}
    </span>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-400" :
    score >= 60 ? "bg-orange-400" :
                  "bg-gray-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Score</span>
        <span className="font-mono font-semibold text-white">{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-700">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ─── Style Tag ────────────────────────────────────────────────────────────────

function StyleTag({ style }: { style: DomainSuggestion["style"] }) {
  return (
    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono border border-gray-700 rounded px-2 py-0.5">
      {style}
    </span>
  );
}

// ─── Card Face (domain content) ───────────────────────────────────────────────

function DomainCardFace({
  suggestion,
  onCopy,
  onSave,
  copied,
  saved,
}: {
  suggestion: DomainSuggestion;
  onCopy: () => void;
  onSave: () => void;
  copied: boolean;
  saved: boolean;
}) {
  return (
    <div className="flex flex-col justify-between h-full p-6 select-none">
      {/* Top — domain + badges */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <AvailabilityBadge status={suggestion.availabilityStatus} />
          <StyleTag style={suggestion.style} />
        </div>

        {/* Domain name — monospace, large */}
        <div>
          <p className="font-mono text-3xl font-bold text-white tracking-tight leading-none break-all">
            {suggestion.baseName}
            <span className="text-orange-400">{suggestion.tld}</span>
          </p>
          {suggestion.priceEstimate && (
            <p className="text-xs text-gray-500 mt-1 font-mono">
              ~{suggestion.priceEstimate}
            </p>
          )}
        </div>

        {/* Score bar */}
        <ScoreBar score={suggestion.score} />
      </div>

      {/* Middle — AI explanation */}
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
        {suggestion.explanation}
      </p>

      {/* Bottom — actions */}
      <div className="flex gap-2 pt-2">
        <motion.button
          onClick={onCopy}
          whileTap={{ scale: 0.93 }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </motion.button>

        <motion.a
          href={namecheapUrl(suggestion.domain)}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.93 }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-black hover:bg-gray-200 text-xs font-semibold transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Check
        </motion.a>

        <motion.button
          onClick={onSave}
          whileTap={{ scale: 0.93 }}
          className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs transition-colors ${
            saved
              ? "bg-red-500/20 border-red-500/40 text-red-400"
              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
          {saved ? "Saved" : "Save"}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main Card Stack ───────────────────────────────────────────────────────────

export default function DomainCardStack({ suggestions, onSave, initialDomain, initialSaved = [] }: DomainCardStackProps) {
  const rotatedSuggestions = React.useMemo(() => {
    if (!initialDomain) return suggestions;
    const idx = suggestions.findIndex(s => s.domain === initialDomain);
    if (idx <= 0) return suggestions;
    return [...suggestions.slice(idx), ...suggestions.slice(0, idx)];
  }, [suggestions, initialDomain]);

  const [cards, setCards] = useState(rotatedSuggestions);
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initialDomain) return 0;
    const idx = suggestions.findIndex(s => s.domain === initialDomain);
    return idx > 0 ? idx : 0;
  });
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSaved));
  const [dragDirection, setDragDirection] = useState<"up" | "down" | null>(null);

  const dragY = useMotionValue(0);
  const rotateX = useTransform(dragY, [-200, 0, 200], [15, 0, -15]);

  // Card stack config
  const offset = 10;
  const scaleStep = 0.06;
  const dimStep = 0.15;
  const spring = { type: "spring" as const, stiffness: 170, damping: 26 };
  const swipeThreshold = 50;

  const moveToEnd = () => {
    setCards((prev) => [...prev.slice(1), prev[0]]);
    setCurrentIndex((prev) => (prev + 1) % suggestions.length);
  };

  const moveToStart = () => {
    setCards((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
    setCurrentIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
  };

  const resetCards = () => {
    setCards(rotatedSuggestions);
    setCurrentIndex(initialDomain ? Math.max(0, suggestions.findIndex(s => s.domain === initialDomain)) : 0);
  };

  const handleDragEnd = (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
    const { velocity, offset: off } = info;
    if (Math.abs(off.y) > swipeThreshold || Math.abs(velocity.y) > 500) {
      setDragDirection(off.y < 0 || velocity.y < 0 ? "up" : "down");
      setTimeout(() => {
        off.y < 0 || velocity.y < 0 ? moveToEnd() : moveToStart();
        setDragDirection(null);
      }, 150);
    }
    dragY.set(0);
  };

  const handleCopy = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedId(domain);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (suggestion: DomainSuggestion) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(suggestion.domain) ? next.delete(suggestion.domain) : next.add(suggestion.domain);
      return next;
    });
    onSave?.(suggestion);
  };

  if (!cards.length) return null;

  return (
    <div className="w-full flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Animated Grid Background — same as original */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="df-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <motion.path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#df-grid)" />
      </svg>

      {/* Top Controls */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-30">
        <motion.button
          onClick={resetCards}
          className="p-3 rounded-full bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 backdrop-blur-sm transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reset"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </motion.button>
        <p className="text-gray-500 text-sm font-mono">
          {currentIndex + 1} / {suggestions.length}
        </p>
      </div>

      {/* Left / Right nav */}
      <motion.button
        onClick={moveToStart}
        className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 backdrop-blur-sm z-20"
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </motion.button>

      <motion.button
        onClick={moveToEnd}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 backdrop-blur-sm z-20"
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </motion.button>

      {/* Card Stack */}
      <div className="relative w-80 h-96 overflow-visible z-10 mt-32">
        <ul className="relative w-full h-full m-0 p-0">
          <AnimatePresence>
            {cards.map((suggestion, i) => {
              const isFront = i === 0;
              const brightness = Math.max(0.3, 1 - i * dimStep);

              return (
                <motion.li
                  key={suggestion.domain}
                  className={`absolute w-full h-full list-none overflow-hidden border-2 bg-gray-900 transition-colors duration-500 ${
                    isFront && suggestion.availabilityStatus === "available"
                      ? "border-green-500/30"
                      : "border-gray-700"
                  }`}
                  style={{
                    borderRadius: "12px",
                    cursor: isFront ? "grab" : "auto",
                    touchAction: "none",
                    boxShadow: isFront
                      ? suggestion.availabilityStatus === "available"
                        ? "0 0 40px rgba(74, 222, 128, 0.15), 0 25px 50px rgba(0,0,0,0.7)"
                        : "0 25px 50px rgba(0,0,0,0.7)"
                      : "0 15px 30px rgba(0,0,0,0.4)",
                    rotateX: isFront ? rotateX : 0,
                    transformPerspective: 1000,
                  }}
                  animate={{
                    top: `${i * -offset}%`,
                    scale: 1 - i * scaleStep,
                    filter: `brightness(${brightness})`,
                    zIndex: cards.length - i,
                    opacity: dragDirection && isFront ? 0 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={spring}
                  drag={isFront ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  onDrag={(_, info) => { if (isFront) dragY.set(info.offset.y); }}
                  onDragEnd={handleDragEnd}
                  whileDrag={isFront ? { zIndex: cards.length + 1, cursor: "grabbing", scale: 1.05 } : {}}
                >
                  <DomainCardFace
                    suggestion={suggestion}
                    onCopy={() => handleCopy(suggestion.domain)}
                    onSave={() => handleSave(suggestion)}
                    copied={copiedId === suggestion.domain}
                    saved={savedIds.has(suggestion.domain)}
                  />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>

      {/* Progress dots */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {suggestions.map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex % suggestions.length
                ? "bg-white w-8"
                : "bg-gray-700 w-1.5"
            }`}
          />
        ))}
      </div>

    </div>
  );
}
