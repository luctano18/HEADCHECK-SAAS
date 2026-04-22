/**
 * Early Emotional Intervention System (EEIS) — Intervention Engine
 *
 * This module implements the full 10-stage EEIS pipeline:
 *   Stage 1  — Input capture (data types only, no DB)
 *   Stage 2  — Scoring (emotional_intensity, stress_load, readiness)
 *   Stage 3  — Classification (Green / Yellow / Red)
 *   Stage 4  — Risk detection (hybrid: keyword first, LLM fallback)
 *   Stage 5  — Stabilization message
 *   Stage 6  — Redirection (single next step)
 *   Stage 7  — Escalation logic
 *   Stage 8  — Crisis screen trigger
 *   Stage 9  — Pattern detection
 *   Stage 10 — Full session storage (handled in routers.ts)
 */

import { invokeLLM } from "./_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tier = "green" | "yellow" | "red";
export type RiskLevel = "none" | "crisis";
export type DidHelp = "yes_clearer" | "somewhat_calmer" | "not_yet";

export interface CheckInInputs {
  primaryEmotion: string;           // step 1
  contributors: string[];           // step 2
  emotionalImpact: string[];        // step 3
  intenseFeelings: string[];        // step 4
  secondaryStressors: string[];     // step 5
  supportPreference?: string;       // step 6
  possibleNextStep?: string;        // step 7
  supportSource?: string;           // step 8
  didHelp?: DidHelp;                // step 9
  journalNotes?: string;            // step 10
  otherInputs?: Record<string, string>;
  // Legacy fields (from existing check-in)
  intensity?: number;               // 1-10 slider (used for emotional_intensity score)
  context?: string;
}

export interface InterventionScores {
  emotionalIntensityScore: number;  // 0-4
  stressLoadScore: number;          // 0-4
  readinessScore: number;           // 0-4 (inverted: low readiness = high score)
  totalScore: number;               // 0-12
}

export interface TierClassification {
  tier: Tier;
  label: string;
  color: string;
  description: string;
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  riskOverride: boolean;
  riskReasons: string[];
  severity?: "moderate" | "high" | "critical";
}

export interface StabilizationOutput {
  message: string;
  subtext: string;
  breathingPrompt?: string;
}

export interface RedirectionOutput {
  nextStep: string;
  nextStepReason: string;
  actionLabel: string;
  actionUrl?: string;
}

export interface EscalationCheck {
  shouldEscalate: boolean;
  reason?: string;
}

export interface InterventionResult {
  scores: InterventionScores;
  classification: TierClassification;
  risk: RiskAssessment;
  stabilization: StabilizationOutput;
  redirection: RedirectionOutput;
  escalation: EscalationCheck;
}

// ─── Thresholds (defaults — overridden by institution config) ─────────────────

export interface TierThresholds {
  greenMax: number;   // default 4
  yellowMax: number;  // default 9
  // red = > yellowMax
}

export const DEFAULT_THRESHOLDS: TierThresholds = {
  greenMax: 4,
  yellowMax: 9,
};

// ─── Stage 2: Scoring ─────────────────────────────────────────────────────────

/**
 * emotional_intensity_score (0-4)
 * Derived from: intensity slider + number of intense feelings selected
 */
function scoreEmotionalIntensity(inputs: CheckInInputs): number {
  let score = 0;
  const intensity = inputs.intensity ?? 5;

  // Intensity slider contribution (0-2)
  if (intensity >= 9) score += 2;
  else if (intensity >= 7) score += 1;

  // Number of intense feelings (step 4) contribution (0-2)
  const numFeelings = inputs.intenseFeelings.length;
  if (numFeelings >= 5) score += 2;
  else if (numFeelings >= 3) score += 1;

  return Math.min(score, 4);
}

/**
 * stress_load_score (0-4)
 * Derived from: contributors count + secondary stressors count
 */
function scoreStressLoad(inputs: CheckInInputs): number {
  let score = 0;

  // Contributors (step 2)
  const numContributors = inputs.contributors.filter(c => c !== "Not sure").length;
  if (numContributors >= 5) score += 2;
  else if (numContributors >= 3) score += 1;

  // Secondary stressors (step 5)
  const numStressors = inputs.secondaryStressors.filter(s => s !== "Not sure").length;
  if (numStressors >= 4) score += 2;
  else if (numStressors >= 2) score += 1;

  return Math.min(score, 4);
}

/**
 * readiness_score (0-4) — inverted: low readiness = high score
 * Derived from: support preference + possible next step + did_help
 */
function scoreReadiness(inputs: CheckInInputs): number {
  let score = 0;

  // Support preference signals low readiness
  const lowReadinessPrefs = ["Time to pause and breathe", "Help calming down"];
  if (inputs.supportPreference && lowReadinessPrefs.some(p => inputs.supportPreference!.includes(p))) {
    score += 1;
  }

  // Possible next step signals low readiness
  const lowReadinessSteps = ["Pause and come back later", "Take a short break"];
  if (inputs.possibleNextStep && lowReadinessSteps.some(s => inputs.possibleNextStep!.includes(s))) {
    score += 1;
  }

  // Did help = not_yet signals low readiness
  if (inputs.didHelp === "not_yet") score += 2;
  else if (inputs.didHelp === "somewhat_calmer") score += 1;

  return Math.min(score, 4);
}

export function calculateScores(inputs: CheckInInputs): InterventionScores {
  const emotionalIntensityScore = scoreEmotionalIntensity(inputs);
  const stressLoadScore = scoreStressLoad(inputs);
  const readinessScore = scoreReadiness(inputs);
  const totalScore = emotionalIntensityScore + stressLoadScore + readinessScore;
  return { emotionalIntensityScore, stressLoadScore, readinessScore, totalScore };
}

// ─── Stage 3: Classification ──────────────────────────────────────────────────

export function classifyTier(
  totalScore: number,
  thresholds: TierThresholds = DEFAULT_THRESHOLDS
): TierClassification {
  if (totalScore <= thresholds.greenMax) {
    return {
      tier: "green",
      label: "Grounded",
      color: "#16a34a",
      description: "You're navigating this with some clarity. Let's build on that.",
    };
  }
  if (totalScore <= thresholds.yellowMax) {
    return {
      tier: "yellow",
      label: "Stretched",
      color: "#d97706",
      description: "You're carrying a lot right now. You don't have to carry it alone.",
    };
  }
  return {
    tier: "red",
    label: "Overwhelmed",
    color: "#dc2626",
    description: "This is a heavy moment. Let's slow down and find one safe step together.",
  };
}

// ─── Stage 4: Risk Detection (Hybrid) ────────────────────────────────────────

// Keyword lists — first-pass fast filter
const CRISIS_KEYWORDS_CRITICAL = [
  "kill myself", "suicide", "end my life", "want to die", "don't want to live",
  "no reason to live", "better off dead", "give up on life", "i want to disappear forever",
  "i want to end it all", "overdose", "jump off", "hang myself",
  "me tuer", "je veux mourir", "en finir", "mettre fin à ma vie",
];
const CRISIS_KEYWORDS_HIGH = [
  "hurt myself", "self-harm", "cutting myself", "i feel unsafe",
  "can't go on", "hopeless", "worthless", "can't take it anymore",
  "nobody cares", "disappear forever", "i want to disappear",
  "me faire du mal", "me blesser", "sans espoir", "je veux disparaître",
];
const CRISIS_KEYWORDS_MODERATE = [
  "overwhelmed and can't cope", "completely hopeless", "feel worthless",
  "don't want to be here", "no point", "give up",
];

function keywordRiskScan(text: string): { detected: boolean; severity?: "moderate" | "high" | "critical"; reasons: string[] } {
  const lower = text.toLowerCase();
  const reasons: string[] = [];

  if (CRISIS_KEYWORDS_CRITICAL.some(k => lower.includes(k))) {
    reasons.push("Critical self-harm language detected");
    return { detected: true, severity: "critical", reasons };
  }
  if (CRISIS_KEYWORDS_HIGH.some(k => lower.includes(k))) {
    reasons.push("High-risk language detected");
    return { detected: true, severity: "high", reasons };
  }
  if (CRISIS_KEYWORDS_MODERATE.some(k => lower.includes(k))) {
    reasons.push("Moderate distress language detected");
    return { detected: true, severity: "moderate", reasons };
  }
  return { detected: false, reasons };
}

/**
 * LLM fallback — only called when keyword scan is inconclusive but
 * intensity >= 8 AND (tier = red OR intenseFeelings contains Hopelessness/Isolation)
 */
async function llmRiskScan(text: string, context: string): Promise<{ detected: boolean; severity?: "moderate" | "high" | "critical"; reasons: string[] }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a mental health safety screening assistant. Analyze the following student text for signs of self-harm risk or suicidal ideation. 
Respond ONLY with valid JSON: { "detected": boolean, "severity": "none" | "moderate" | "high" | "critical", "reasons": string[] }
Be conservative — only flag if there is genuine concern. Do not flag general sadness or frustration.`,
        },
        {
          role: "user",
          content: `Student context: ${context}\nStudent text: "${text}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "risk_scan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              detected: { type: "boolean" },
              severity: { type: "string" },
              reasons: { type: "array", items: { type: "string" } },
            },
            required: ["detected", "severity", "reasons"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) return { detected: false, reasons: [] };
    const parsed = JSON.parse(typeof content === "string" ? content : "{}");
    return {
      detected: parsed.detected === true,
      severity: parsed.severity === "none" ? undefined : parsed.severity,
      reasons: parsed.reasons ?? [],
    };
  } catch {
    return { detected: false, reasons: [] };
  }
}

export async function assessRisk(inputs: CheckInInputs): Promise<RiskAssessment> {
  const textToScan = [
    inputs.journalNotes ?? "",
    ...Object.values(inputs.otherInputs ?? {}),
  ].join(" ").trim();

  // Fast keyword scan
  const keywordResult = keywordRiskScan(textToScan);
  if (keywordResult.detected) {
    return {
      riskLevel: "crisis",
      riskOverride: true,
      riskReasons: keywordResult.reasons,
      severity: keywordResult.severity,
    };
  }

  // LLM fallback — only when high intensity + high distress signals
  const intensity = inputs.intensity ?? 5;
  const hasHopelessness = inputs.intenseFeelings.some(f =>
    ["Hopelessness", "Isolation"].includes(f)
  );
  const shouldUseLLM = textToScan.length > 20 && intensity >= 8 && hasHopelessness;

  if (shouldUseLLM) {
    const context = `Emotion: ${inputs.primaryEmotion}, Intensity: ${intensity}/10, Feelings: ${inputs.intenseFeelings.join(", ")}`;
    const llmResult = await llmRiskScan(textToScan, context);
    if (llmResult.detected) {
      return {
        riskLevel: "crisis",
        riskOverride: true,
        riskReasons: ["LLM risk assessment: " + llmResult.reasons.join("; ")],
        severity: llmResult.severity,
      };
    }
  }

  return { riskLevel: "none", riskOverride: false, riskReasons: [] };
}

// ─── Stage 5: Stabilization ───────────────────────────────────────────────────

const STABILIZATION_MESSAGES: Record<Tier, StabilizationOutput> = {
  green: {
    message: "You're doing well by checking in.",
    subtext: "Awareness is the first step. You're already moving in the right direction.",
  },
  yellow: {
    message: "You're carrying a lot right now — and that's real.",
    subtext: "Naming what you're feeling is a powerful act. Let's find one small step together.",
    breathingPrompt: "Take a slow breath in for 4 counts, hold for 4, out for 4.",
  },
  red: {
    message: "This is a heavy moment. You don't have to face it alone.",
    subtext: "Let's slow down. One breath, one step at a time. You're safe here.",
    breathingPrompt: "Breathe in slowly for 4 counts, hold for 7, breathe out for 8.",
  },
};

export function buildStabilizationMessage(tier: Tier): StabilizationOutput {
  return STABILIZATION_MESSAGES[tier];
}

// ─── Stage 6: Redirection (single next step) ──────────────────────────────────

interface NextStepRule {
  condition: (inputs: CheckInInputs, tier: Tier) => boolean;
  nextStep: string;
  nextStepReason: string;
  actionLabel: string;
  actionUrl?: string;
}

const NEXT_STEP_RULES: NextStepRule[] = [
  // Red tier — always prioritize support
  {
    condition: (_, tier) => tier === "red",
    nextStep: "Connect with a support person today",
    nextStepReason: "When feelings are this intense, reaching out is the most important step.",
    actionLabel: "Find Support",
    actionUrl: "/resources",
  },
  // Yellow + support preference = someone to talk to
  {
    condition: (inputs, tier) =>
      tier === "yellow" &&
      (inputs.supportPreference?.includes("Someone to talk to") ?? false),
    nextStep: "Reach out to one trusted person",
    nextStepReason: "You identified that talking to someone would help. That instinct is right.",
    actionLabel: "Message Your Advisor",
  },
  // Yellow + did_help = not_yet
  {
    condition: (inputs, tier) => tier === "yellow" && inputs.didHelp === "not_yet",
    nextStep: "Schedule a 15-minute check-in with your advisor",
    nextStepReason: "This check-in didn't fully resolve things — a conversation can help.",
    actionLabel: "Book a Session",
    actionUrl: "/coaching",
  },
  // Hopelessness or Isolation in intense feelings
  {
    condition: (inputs) =>
      inputs.intenseFeelings.some(f => ["Hopelessness", "Isolation"].includes(f)),
    nextStep: "Reach out to someone who knows you",
    nextStepReason: "Feelings of hopelessness and isolation are signals to connect, not withdraw.",
    actionLabel: "Find Support",
    actionUrl: "/resources",
  },
  // User selected a specific next step
  {
    condition: (inputs) => !!inputs.possibleNextStep && !["Pause and come back later"].includes(inputs.possibleNextStep ?? ""),
    nextStep: "Use your identified next step",
    nextStepReason: "You already identified what feels possible — trust that.",
    actionLabel: "Let's Do It",
  },
  // Default green
  {
    condition: () => true,
    nextStep: "Continue your check-in streak",
    nextStepReason: "Consistency builds emotional resilience. Come back tomorrow.",
    actionLabel: "Set a Reminder",
    actionUrl: "/settings",
  },
];

export function buildRedirection(inputs: CheckInInputs, tier: Tier): RedirectionOutput {
  for (const rule of NEXT_STEP_RULES) {
    if (rule.condition(inputs, tier)) {
      const nextStep = typeof rule.nextStep === "function"
        ? (rule.nextStep as (i: CheckInInputs) => string)(inputs)
        : rule.nextStep;
      return {
        nextStep,
        nextStepReason: rule.nextStepReason,
        actionLabel: rule.actionLabel,
        actionUrl: rule.actionUrl,
      };
    }
  }
  return {
    nextStep: "Continue your check-in streak",
    nextStepReason: "Consistency builds emotional resilience.",
    actionLabel: "Set a Reminder",
  };
}

// ─── Stage 7: Escalation Logic ────────────────────────────────────────────────

export interface EscalationContext {
  tier: Tier;
  didHelp?: DidHelp;
  intensity?: number;
  recentYellowCount: number;  // Yellow sessions in last N days
  recentNotYetCount: number;  // "not_yet" responses in last N sessions
  thresholds: {
    yellowRepeatDays: number;
    yellowRepeatCount: number;
    lowResolutionCount: number;
  };
}

export function checkEscalation(ctx: EscalationContext): EscalationCheck {
  // Red tier always escalates
  if (ctx.tier === "red") {
    return { shouldEscalate: true, reason: "Red tier classification" };
  }

  // Yellow repeated N times in window
  if (ctx.recentYellowCount >= ctx.thresholds.yellowRepeatCount) {
    return {
      shouldEscalate: true,
      reason: `Yellow tier detected ${ctx.recentYellowCount} times in the last ${ctx.thresholds.yellowRepeatDays} days`,
    };
  }

  // Low resolution repeated
  if (ctx.recentNotYetCount >= ctx.thresholds.lowResolutionCount) {
    return {
      shouldEscalate: true,
      reason: `Check-in did not help ${ctx.recentNotYetCount} consecutive times`,
    };
  }

  // High intensity + did_help = not_yet
  if ((ctx.intensity ?? 0) >= 8 && ctx.didHelp === "not_yet") {
    return {
      shouldEscalate: true,
      reason: "High intensity with unresolved distress",
    };
  }

  return { shouldEscalate: false };
}

// ─── Stage 9: Pattern Detection ───────────────────────────────────────────────

export interface PatternAnalysis {
  recurringEmotion?: string;
  recurringEmotionCount?: number;
  hasEscalationPattern: boolean;
  hasLowResolutionPattern: boolean;
  hasSupportAvoidance: boolean;
  hasSupportSeeking: boolean;
}

export interface RecentSessionSummary {
  primaryEmotion: string;
  tier: Tier;
  didHelp?: DidHelp;
  supportSource?: string;
  createdAt: Date;
}

export function detectPatterns(sessions: RecentSessionSummary[]): PatternAnalysis {
  if (sessions.length < 3) {
    return { hasEscalationPattern: false, hasLowResolutionPattern: false, hasSupportAvoidance: false, hasSupportSeeking: false };
  }

  // Recurring emotion — same emotion >= 3 times in last 5 sessions
  const emotionCounts: Record<string, number> = {};
  for (const s of sessions.slice(0, 5)) {
    emotionCounts[s.primaryEmotion] = (emotionCounts[s.primaryEmotion] ?? 0) + 1;
  }
  const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
  const recurringEmotion = topEmotion && topEmotion[1] >= 3 ? topEmotion[0] : undefined;

  // Escalation pattern — 2+ red/yellow in last 3 sessions
  const recentHighTier = sessions.slice(0, 3).filter(s => s.tier === "red" || s.tier === "yellow");
  const hasEscalationPattern = recentHighTier.length >= 2;

  // Low resolution — 2+ not_yet in last 3 sessions
  const recentNotYet = sessions.slice(0, 3).filter(s => s.didHelp === "not_yet");
  const hasLowResolutionPattern = recentNotYet.length >= 2;

  // Support avoidance — "Not ready yet" or "Not sure yet" in last 3 sessions
  const avoidanceValues = ["Not ready yet", "Not sure yet"];
  const hasSupportAvoidance = sessions.slice(0, 3).some(s =>
    s.supportSource && avoidanceValues.includes(s.supportSource)
  );

  // Support seeking — explicitly chose a support source in last 2 sessions
  const seekingValues = ["Instructor", "Academic advisor", "Mental health or counseling support", "Friend or family member"];
  const hasSupportSeeking = sessions.slice(0, 2).filter(s =>
    s.supportSource && seekingValues.includes(s.supportSource)
  ).length >= 2;

  return {
    recurringEmotion,
    recurringEmotionCount: recurringEmotion ? topEmotion[1] : undefined,
    hasEscalationPattern,
    hasLowResolutionPattern,
    hasSupportAvoidance,
    hasSupportSeeking,
  };
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export async function runInterventionPipeline(
  inputs: CheckInInputs,
  escalationContext: Omit<EscalationContext, "tier" | "didHelp" | "intensity">,
  thresholds: TierThresholds = DEFAULT_THRESHOLDS
): Promise<InterventionResult> {
  // Stage 2: Scoring
  const scores = calculateScores(inputs);

  // Stage 3: Classification
  const classification = classifyTier(scores.totalScore, thresholds);

  // Stage 4: Risk detection (async — may call LLM)
  const risk = await assessRisk(inputs);

  // Stage 5: Stabilization
  const stabilization = buildStabilizationMessage(classification.tier);

  // Stage 6: Redirection
  const redirection = buildRedirection(inputs, classification.tier);

  // Stage 7: Escalation
  const escalation = checkEscalation({
    ...escalationContext,
    tier: classification.tier,
    didHelp: inputs.didHelp,
    intensity: inputs.intensity,
    thresholds: escalationContext.thresholds,
  });

  return { scores, classification, risk, stabilization, redirection, escalation };
}
