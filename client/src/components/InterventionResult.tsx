/**
 * InterventionResult — EEIS Stage 5-6 UI
 *
 * Displays:
 *  - Tier badge (Green / Yellow / Red)
 *  - Stabilization message + optional breathing prompt
 *  - Single next step with action button
 *  - Pattern flags (if any)
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";

interface StabilizationOutput {
  message: string;
  subtext: string;
  breathingPrompt?: string;
}

interface RedirectionOutput {
  nextStep: string;
  nextStepReason: string;
  actionLabel: string;
  actionUrl?: string;
}

interface InterventionData {
  tier: "green" | "yellow" | "red";
  tierLabel: string;
  tierColor: string;
  scores: {
    emotionalIntensityScore: number;
    stressLoadScore: number;
    readinessScore: number;
    totalScore: number;
  };
  riskOverride: boolean;
  riskLevel: "none" | "crisis";
  stabilization: StabilizationOutput;
  redirection: RedirectionOutput;
  escalationTriggered: boolean;
  escalationReason?: string;
  interventionSessionId?: number;
}

interface InterventionResultProps {
  intervention: InterventionData;
  onContinue: () => void;
  onEscalation?: () => void;
}

const TIER_CONFIG = {
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: "🌱",
    barColor: "bg-emerald-500",
    glow: "shadow-emerald-100 dark:shadow-emerald-900/20",
  },
  yellow: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    icon: "🌤",
    barColor: "bg-amber-500",
    glow: "shadow-amber-100 dark:shadow-amber-900/20",
  },
  red: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    icon: "🌧",
    barColor: "bg-rose-500",
    glow: "shadow-rose-100 dark:shadow-rose-900/20",
  },
};

function BreathingExercise({ prompt }: { prompt: string }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [count, setCount] = useState(4);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const durations = { in: 4, hold: 4, out: 4 };
    // Detect 4-7-8 pattern
    if (prompt.includes("7") && prompt.includes("8")) {
      durations.in = 4; durations.hold = 7; durations.out = 8;
    }
    let remaining = durations[phase];
    setCount(remaining);
    const interval = setInterval(() => {
      remaining--;
      setCount(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setPhase(p => p === "in" ? "hold" : p === "hold" ? "out" : "in");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, active, prompt]);

  return (
    <div className="mt-4 p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-center">
      <p className="text-sm text-muted-foreground mb-3">{prompt}</p>
      {!active ? (
        <button
          onClick={() => setActive(true)}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Start Breathing Exercise
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="w-16 h-16 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200"
            animate={{
              scale: phase === "in" ? 1.4 : phase === "hold" ? 1.4 : 0.8,
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            {count}
          </motion.div>
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 capitalize">
            {phase === "in" ? "Breathe In" : phase === "hold" ? "Hold" : "Breathe Out"}
          </p>
          <button onClick={() => { setActive(false); setPhase("in"); }} className="text-xs text-muted-foreground underline mt-1">
            Stop
          </button>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, max = 4, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value}/{max}</span>
    </div>
  );
}

export function InterventionResult({ intervention, onContinue, onEscalation }: InterventionResultProps) {
  const cfg = TIER_CONFIG[intervention.tier];
  const markFlagsShown = trpc.intervention.markPatternFlagsShown.useMutation();
  const { data: patternFlags } = trpc.intervention.getPatternFlags.useQuery();

  const FLAG_MESSAGES: Record<string, string> = {
    recurring_emotion: `You've been checking in with similar feelings lately. That's worth noticing — patterns are information.`,
    escalation_pattern: `Your recent check-ins suggest things have been building up. You don't have to carry this alone.`,
    low_resolution: `Your last few check-ins didn't fully resolve things. A conversation with someone might help.`,
    support_avoidance: `You've indicated you're not ready for support a few times. That's okay — but we're here when you are.`,
    support_seeking: `You've been reaching out for support consistently. That takes courage. Keep going.`,
  };

  useEffect(() => {
    if (patternFlags && patternFlags.length > 0) {
      // Mark as shown after 3 seconds
      const t = setTimeout(() => markFlagsShown.mutate(), 3000);
      return () => clearTimeout(t);
    }
  }, [patternFlags]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto space-y-5"
    >
      {/* Tier Badge */}
      <div className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{cfg.icon}</span>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.badge}`}>
              {intervention.tierLabel}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Emotional State Assessment</p>
          </div>
        </div>

        {/* Stabilization Message */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {intervention.stabilization.message}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intervention.stabilization.subtext}
        </p>

        {/* Breathing Exercise (Yellow/Red only) */}
        {intervention.stabilization.breathingPrompt && (
          <BreathingExercise prompt={intervention.stabilization.breathingPrompt} />
        )}
      </div>

      {/* Score Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground mb-1">How we assessed your state</h3>
        <ScoreBar label="Emotional Intensity" value={intervention.scores.emotionalIntensityScore} color={cfg.barColor} />
        <ScoreBar label="Stress Load" value={intervention.scores.stressLoadScore} color={cfg.barColor} />
        <ScoreBar label="Readiness" value={intervention.scores.readinessScore} color={cfg.barColor} />
        <div className="pt-2 border-t border-border flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Total Score</span>
          <span className="text-sm font-bold">{intervention.scores.totalScore} / 12</span>
        </div>
      </div>

      {/* Next Step */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
          Your Next Step
        </p>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {intervention.redirection.nextStep}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {intervention.redirection.nextStepReason}
        </p>
        {intervention.redirection.actionUrl ? (
          <a
            href={intervention.redirection.actionUrl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {intervention.redirection.actionLabel} →
          </a>
        ) : (
          <button
            onClick={onContinue}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {intervention.redirection.actionLabel} →
          </button>
        )}
      </div>

      {/* Escalation Prompt */}
      <AnimatePresence>
        {intervention.escalationTriggered && onEscalation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5"
          >
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              We noticed something important
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              {intervention.escalationReason ?? "Your recent check-ins suggest you might benefit from additional support."}
            </p>
            <button
              onClick={onEscalation}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Tell me more about support options
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pattern Flags */}
      <AnimatePresence>
        {patternFlags && patternFlags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
              Pattern Insight
            </p>
            {patternFlags.map((flag) => (
              <p key={flag.id} className="text-sm text-muted-foreground">
                {FLAG_MESSAGES[flag.flagType] ?? "We noticed a recurring pattern in your check-ins."}
                {flag.flagValue && ` (${flag.flagValue})`}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
      >
        Continue to your AI insights →
      </button>
    </motion.div>
  );
}
