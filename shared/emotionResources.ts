/**
 * emotionResources.ts
 * Single source of truth for emotion-specific resource recommendations.
 * Each emotion maps to 3 curated resources (mix of articles, exercises, proverbs).
 * Used in CheckInResult.tsx to surface contextual support after a check-in.
 */

export type ResourceType = "Article" | "Exercise" | "Proverb" | "Tool" | "Video" | "Book";

export interface EmotionResource {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  duration: string;
  /** EI category — maps to the filter on the /resources page */
  category: "Self-Awareness" | "Self-Management" | "Social Awareness" | "Relationship Management" | "Neuroscience" | "African Wisdom";
  /** Optional African proverb to display inline */
  proverb?: { text: string; origin: string };
}

export interface EmotionResourceSet {
  /** Canonical lowercase emotion key */
  emotion: string;
  /** Short empathetic headline shown above the resources */
  headline: string;
  resources: EmotionResource[];
}

// ─── Resource Catalogue ──────────────────────────────────────────────────────

const CATALOGUE: Record<string, EmotionResourceSet> = {
  overwhelmed: {
    emotion: "overwhelmed",
    headline: "When everything feels like too much, small steps matter most.",
    resources: [
      {
        id: "ow-1",
        type: "Exercise",
        title: "The 5-4-3-2-1 Grounding Technique",
        description: "Bring your nervous system back to the present moment by engaging your five senses. Takes only 3 minutes and works anywhere.",
        duration: "3 min",
        category: "Self-Management",
      },
      {
        id: "ow-2",
        type: "Article",
        title: "Why Your Brain Feels Overwhelmed (and What to Do)",
        description: "Understand how amygdala activation reduces your prefrontal cortex capacity — and the science-backed steps to restore clarity.",
        duration: "5 min read",
        category: "Neuroscience",
      },
      {
        id: "ow-3",
        type: "Proverb",
        title: "African Wisdom on Endurance",
        description: "A reminder that this moment, however heavy, will pass.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "No matter how long the night, the day is sure to come.", origin: "Ghana" },
      },
    ],
  },

  anxious: {
    emotion: "anxious",
    headline: "Anxiety is your brain trying to protect you. Let's work with it.",
    resources: [
      {
        id: "ax-1",
        type: "Exercise",
        title: "Box Breathing for Anxiety Relief",
        description: "4-4-4-4 breathing activates your parasympathetic nervous system, reducing cortisol and calming the amygdala within minutes.",
        duration: "5 min",
        category: "Self-Management",
      },
      {
        id: "ax-2",
        type: "Article",
        title: "Naming Your Fear: Why Labeling Emotions Reduces Them",
        description: "Research shows that putting a name to an anxious feeling reduces its intensity by activating the prefrontal cortex. Learn how to use this technique daily.",
        duration: "6 min read",
        category: "Self-Awareness",
      },
      {
        id: "ax-3",
        type: "Proverb",
        title: "African Wisdom on Trust and Calm",
        description: "Ancestral wisdom on releasing the grip of fear.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "Do not look where you fell, but where you slipped.", origin: "African Proverb" },
      },
    ],
  },

  stressed: {
    emotion: "stressed",
    headline: "Stress is a signal. Here's how to respond instead of react.",
    resources: [
      {
        id: "st-1",
        type: "Exercise",
        title: "Progressive Muscle Relaxation",
        description: "Systematically tense and release muscle groups to discharge physical stress stored in the body. Proven to reduce cortisol levels.",
        duration: "10 min",
        category: "Self-Management",
      },
      {
        id: "st-2",
        type: "Article",
        title: "The Stress-Performance Curve: Finding Your Optimal Zone",
        description: "Not all stress is bad. Learn the difference between eustress and distress, and how to stay in your peak performance zone.",
        duration: "7 min read",
        category: "Neuroscience",
      },
      {
        id: "st-3",
        type: "Proverb",
        title: "African Wisdom on Pace and Presence",
        description: "A gentle reminder to slow down when the world speeds up.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "Hurry, hurry has no blessing.", origin: "Swahili" },
      },
    ],
  },

  sad: {
    emotion: "sad",
    headline: "Sadness is not weakness — it is the heart processing something real.",
    resources: [
      {
        id: "sa-1",
        type: "Exercise",
        title: "Compassionate Journaling",
        description: "Write to yourself as you would to a close friend who is hurting. This activates self-compassion circuits and reduces rumination.",
        duration: "15 min",
        category: "Self-Awareness",
      },
      {
        id: "sa-2",
        type: "Article",
        title: "The Neuroscience of Sadness: Why Crying Helps",
        description: "Tears release stress hormones and signal the brain to shift from threat mode to rest. Understand why allowing sadness is healthy.",
        duration: "5 min read",
        category: "Neuroscience",
      },
      {
        id: "sa-3",
        type: "Proverb",
        title: "African Wisdom on Healing",
        description: "Sadness shared is sadness halved.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "Rain does not fall on one roof alone.", origin: "Cameroonian Proverb" },
      },
    ],
  },

  angry: {
    emotion: "angry",
    headline: "Anger carries important information. Let's listen before it speaks for you.",
    resources: [
      {
        id: "an-1",
        type: "Exercise",
        title: "The Pause Practice: 10 Seconds to Clarity",
        description: "Before responding to a trigger, pause for 10 seconds. This simple habit activates the prefrontal cortex and prevents amygdala hijack.",
        duration: "Ongoing practice",
        category: "Self-Management",
      },
      {
        id: "an-2",
        type: "Article",
        title: "What Your Anger Is Really Telling You",
        description: "Anger is often a secondary emotion masking hurt, fear, or unmet needs. Learn to decode the message beneath the feeling.",
        duration: "6 min read",
        category: "Self-Awareness",
      },
      {
        id: "an-3",
        type: "Proverb",
        title: "African Wisdom on Restraint",
        description: "The power of choosing your response.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "A wise man does not speak all he knows, but knows all he speaks.", origin: "African Proverb" },
      },
    ],
  },

  discouraged: {
    emotion: "discouraged",
    headline: "Discouragement is not failure — it is the gap between effort and result.",
    resources: [
      {
        id: "di-1",
        type: "Exercise",
        title: "The Evidence Journal: Tracking Your Wins",
        description: "Write down 3 things you have done well this week, no matter how small. Rewires the brain away from negativity bias.",
        duration: "10 min",
        category: "Self-Awareness",
      },
      {
        id: "di-2",
        type: "Article",
        title: "Growth Mindset in Practice: Reframing Setbacks",
        description: "Learn how to shift from 'I failed' to 'I am learning'. Practical strategies grounded in Carol Dweck's research.",
        duration: "7 min read",
        category: "Self-Management",
      },
      {
        id: "di-3",
        type: "Proverb",
        title: "African Wisdom on Persistence",
        description: "Small steps compound into great journeys.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "Little by little, a little becomes a lot.", origin: "Tanzanian Proverb" },
      },
    ],
  },

  numb: {
    emotion: "numb",
    headline: "Numbness is your nervous system asking for safety before feeling.",
    resources: [
      {
        id: "nu-1",
        type: "Exercise",
        title: "Gentle Body Scan Meditation",
        description: "Slowly bring awareness to each part of your body without judgment. Helps reconnect mind and body when emotional shutdown has occurred.",
        duration: "10 min",
        category: "Self-Awareness",
      },
      {
        id: "nu-2",
        type: "Article",
        title: "Emotional Numbness: What It Is and How to Gently Return",
        description: "Understand why the brain shuts down emotional processing under extreme stress, and how to safely re-engage your feelings.",
        duration: "6 min read",
        category: "Neuroscience",
      },
      {
        id: "nu-3",
        type: "Proverb",
        title: "African Wisdom on Reconnection",
        description: "A call to return to your own presence.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "Return to yourself.", origin: "African Proverb" },
      },
    ],
  },

  confused: {
    emotion: "confused",
    headline: "Confusion is the beginning of clarity. You are asking the right questions.",
    resources: [
      {
        id: "co-1",
        type: "Exercise",
        title: "Mind Mapping Your Thoughts",
        description: "Put your confusion on paper. Draw a central question and branch out every related thought. Externalizing mental clutter creates space for clarity.",
        duration: "15 min",
        category: "Self-Awareness",
      },
      {
        id: "co-2",
        type: "Article",
        title: "Decision Fatigue and the Overloaded Prefrontal Cortex",
        description: "When you feel confused, your brain may simply be overloaded. Learn how to reduce cognitive load and restore decision-making capacity.",
        duration: "5 min read",
        category: "Neuroscience",
      },
      {
        id: "co-3",
        type: "Proverb",
        title: "African Wisdom on Stillness and Clarity",
        description: "Wisdom emerges when the mind quiets.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "Clarity comes with stillness.", origin: "African Proverb" },
      },
    ],
  },

  frustrated: {
    emotion: "frustrated",
    headline: "Frustration means you care. Let's channel that energy constructively.",
    resources: [
      {
        id: "fr-1",
        type: "Exercise",
        title: "The Reframe Exercise: From Blocked to Redirected",
        description: "Identify the blocked goal, then ask: what is one small action I can take right now? Shifts the brain from threat to problem-solving mode.",
        duration: "10 min",
        category: "Self-Management",
      },
      {
        id: "fr-2",
        type: "Article",
        title: "Why Frustration Is a Healthy Emotion (When Managed Well)",
        description: "Frustration signals unmet expectations. Learn to use it as data rather than a driver, and transform it into motivation.",
        duration: "6 min read",
        category: "Self-Awareness",
      },
      {
        id: "fr-3",
        type: "Proverb",
        title: "African Wisdom on Patience and Progress",
        description: "Sustained effort outlasts momentary obstacles.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "The forest would be silent if no bird sang except the one that sang best.", origin: "African Proverb" },
      },
    ],
  },

  "hopeful but uncertain": {
    emotion: "hopeful but uncertain",
    headline: "Hope with uncertainty is courage. You are already moving forward.",
    resources: [
      {
        id: "ho-1",
        type: "Exercise",
        title: "Values Clarification: Your North Star",
        description: "Identify your top 3 values and write one action aligned with each. When the path is unclear, values become your compass.",
        duration: "20 min",
        category: "Self-Awareness",
      },
      {
        id: "ho-2",
        type: "Article",
        title: "The Neuroscience of Hope: How Optimism Rewires the Brain",
        description: "Hope activates dopamine pathways and strengthens the prefrontal cortex. Learn how to cultivate it intentionally even in uncertainty.",
        duration: "7 min read",
        category: "Neuroscience",
      },
      {
        id: "ho-3",
        type: "Proverb",
        title: "African Wisdom on Community and Strength",
        description: "You do not have to walk this path alone.",
        duration: "1 min",
        category: "African Wisdom",
        proverb: { text: "If you want to go fast, go alone. If you want to go far, go together.", origin: "African Proverb" },
      },
    ],
  },
};

// ─── Generic fallback ─────────────────────────────────────────────────────────

const FALLBACK: EmotionResourceSet = {
  emotion: "general",
  headline: "Whatever you are feeling, you deserve support and understanding.",
  resources: [
    {
      id: "gen-1",
      type: "Exercise",
      title: "The Daily Check-In Practice",
      description: "Spend 5 minutes each morning naming your emotion, rating its intensity, and choosing one supportive action. Builds emotional self-awareness over time.",
      duration: "5 min",
      category: "Self-Awareness",
    },
    {
      id: "gen-2",
      type: "Article",
      title: "Emotional Intelligence: The Foundation of Wellbeing",
      description: "An introduction to the five pillars of EI and why developing them transforms your relationships, performance, and mental health.",
      duration: "8 min read",
      category: "Self-Awareness",
    },
    {
      id: "gen-3",
      type: "Proverb",
      title: "African Wisdom on Community",
      description: "A reminder that you are never alone in your experience.",
      duration: "1 min",
      category: "African Wisdom",
      proverb: { text: "A child who is not embraced by the village will burn it down to feel its warmth.", origin: "African Proverb" },
    },
  ],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the resource set for a given emotion string.
 * Normalizes to lowercase and falls back to the generic set if not found.
 */
export function getResourcesForEmotion(emotion: string): EmotionResourceSet {
  const key = emotion.toLowerCase().trim();
  return CATALOGUE[key] ?? FALLBACK;
}

/** All available emotion keys (for testing / admin use) */
export const EMOTION_RESOURCE_KEYS = Object.keys(CATALOGUE);
