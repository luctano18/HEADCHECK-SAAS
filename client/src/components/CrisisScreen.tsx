/**
 * CrisisScreen — EEIS Stage 8
 *
 * Shown when riskOverride = true (critical language detected).
 * Provides 4 immediate actions:
 *   1. Call 988 (Suicide & Crisis Lifeline)
 *   2. Reach out to a trusted person
 *   3. Emergency services (911)
 *   4. Stay with me (breathing + grounding)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CrisisScreenProps {
  onStayWithMe: () => void;
  onContinue?: () => void;
}

const ACTIONS = [
  {
    id: "988",
    icon: "📞",
    label: "Call or Text 988",
    sublabel: "Suicide & Crisis Lifeline — free, confidential, 24/7",
    color: "bg-rose-600 hover:bg-rose-700",
    href: "tel:988",
  },
  {
    id: "trusted",
    icon: "🤝",
    label: "Reach Out to Someone You Trust",
    sublabel: "A friend, family member, or advisor who knows you",
    color: "bg-indigo-600 hover:bg-indigo-700",
    href: null,
  },
  {
    id: "emergency",
    icon: "🚨",
    label: "Call Emergency Services",
    sublabel: "If you are in immediate danger — call 911",
    color: "bg-orange-600 hover:bg-orange-700",
    href: "tel:911",
  },
  {
    id: "stay",
    icon: "🫁",
    label: "Stay With Me",
    sublabel: "I'll guide you through a grounding exercise right now",
    color: "bg-teal-600 hover:bg-teal-700",
    href: null,
  },
];

function GroundingExercise({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Notice 5 things you can see", icon: "👁", prompt: "Look around you. Name 5 things you can see right now." },
    { title: "Notice 4 things you can touch", icon: "✋", prompt: "Feel the surface under you. Name 4 things you can physically touch." },
    { title: "Notice 3 things you can hear", icon: "👂", prompt: "Listen carefully. Name 3 sounds you can hear right now." },
    { title: "Notice 2 things you can smell", icon: "👃", prompt: "Take a slow breath. Name 2 things you can smell." },
    { title: "Notice 1 thing you can taste", icon: "👅", prompt: "Name 1 thing you can taste right now." },
    { title: "You made it through.", icon: "💙", prompt: "You stayed present. That took courage. You are not alone — reach out to someone when you're ready." },
  ];

  const current = steps[step];

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="text-center space-y-4"
    >
      <span className="text-5xl">{current.icon}</span>
      <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{current.prompt}</p>
      {step < steps.length - 1 ? (
        <button
          onClick={() => setStep(s => s + 1)}
          className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Next →
        </button>
      ) : (
        <button
          onClick={onDone}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          I'm ready to continue
        </button>
      )}
      <div className="flex justify-center gap-1.5 mt-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? "bg-teal-500" : i < step ? "bg-teal-300" : "bg-muted"}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function CrisisScreen({ onStayWithMe, onContinue }: CrisisScreenProps) {
  const [showGrounding, setShowGrounding] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-3xl mx-auto mb-4"
        >
          💙
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          You are not alone.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          What you're feeling right now is real — and it matters. You reached out by checking in,
          and that was brave. Let's find one safe step together.
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {showGrounding ? (
          <motion.div
            key="grounding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 text-center mb-6">
              5-4-3-2-1 Grounding Exercise
            </p>
            <GroundingExercise onDone={() => {
              setShowGrounding(false);
              onStayWithMe();
            }} />
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {ACTIONS.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.5 }}
              >
                {action.href ? (
                  <a
                    href={action.href}
                    className={`flex items-center gap-4 w-full p-4 rounded-2xl text-white ${action.color} transition-colors shadow-sm`}
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs opacity-85">{action.sublabel}</p>
                    </div>
                  </a>
                ) : action.id === "stay" ? (
                  <button
                    onClick={() => setShowGrounding(true)}
                    className={`flex items-center gap-4 w-full p-4 rounded-2xl text-white ${action.color} transition-colors shadow-sm`}
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs opacity-85">{action.sublabel}</p>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // "trusted person" — could open messaging or resources
                      window.location.href = "/resources";
                    }}
                    className={`flex items-center gap-4 w-full p-4 rounded-2xl text-white ${action.color} transition-colors shadow-sm`}
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs opacity-85">{action.sublabel}</p>
                    </div>
                  </button>
                )}
              </motion.div>
            ))}

            {/* Subtle continue option */}
            {onContinue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center pt-2"
              >
                <button
                  onClick={onContinue}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  I'm okay — continue to my check-in results
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
