/**
 * HeadCheck Brain-Emotion Mapping
 * Maps emotions to the brain regions and neuroscience processes involved.
 * Used in AI response generation to provide accurate Brain Insight sections.
 */

export interface BrainEmotionEntry {
  emotion: string;
  primaryRegion: string;
  secondaryRegions: string[];
  process: string;
  protectiveFunction: string;
  neurotransmitters: string[];
}

export const BRAIN_EMOTION_MAP: BrainEmotionEntry[] = [
  {
    emotion: "Anxious",
    primaryRegion: "Amygdala",
    secondaryRegions: ["Prefrontal Cortex", "Hippocampus", "Hypothalamus"],
    process: "The amygdala activates the fight-or-flight response, flooding the body with cortisol and adrenaline. The prefrontal cortex tries to regulate this response but can be overwhelmed under high stress.",
    protectiveFunction: "Anxiety is your brain scanning for threats to keep you safe. It's preparing you to respond to perceived danger.",
    neurotransmitters: ["Cortisol", "Adrenaline", "Norepinephrine"],
  },
  {
    emotion: "Overwhelmed",
    primaryRegion: "Prefrontal Cortex",
    secondaryRegions: ["Amygdala", "Anterior Cingulate Cortex"],
    process: "When cognitive load exceeds capacity, the prefrontal cortex — responsible for decision-making and executive function — becomes dysregulated. The amygdala takes over, triggering emotional flooding.",
    protectiveFunction: "Overwhelm is your brain signaling that it needs rest, support, or a reduction in demands. It's a call for boundaries.",
    neurotransmitters: ["Cortisol", "Dopamine (depleted)", "Serotonin (depleted)"],
  },
  {
    emotion: "Sad",
    primaryRegion: "Limbic System",
    secondaryRegions: ["Prefrontal Cortex", "Hippocampus", "Anterior Cingulate Cortex"],
    process: "Sadness activates the limbic system, particularly areas associated with loss and memory. The hippocampus processes the emotional memory while the prefrontal cortex attempts meaning-making.",
    protectiveFunction: "Sadness is your brain processing loss and signaling the need for connection, comfort, and integration of a difficult experience.",
    neurotransmitters: ["Serotonin (reduced)", "Dopamine (reduced)", "Oxytocin"],
  },
  {
    emotion: "Angry",
    primaryRegion: "Amygdala",
    secondaryRegions: ["Prefrontal Cortex", "Hypothalamus", "Motor Cortex"],
    process: "Anger triggers rapid amygdala activation, releasing adrenaline and cortisol. The prefrontal cortex's ability to regulate this response depends on stress levels and emotional regulation skills.",
    protectiveFunction: "Anger is your brain's response to perceived injustice, boundary violations, or threats. It's mobilizing energy to protect what matters to you.",
    neurotransmitters: ["Adrenaline", "Norepinephrine", "Cortisol", "Testosterone"],
  },
  {
    emotion: "Stressed",
    primaryRegion: "Hypothalamus",
    secondaryRegions: ["Amygdala", "Prefrontal Cortex", "Adrenal Glands"],
    process: "The hypothalamus activates the HPA axis (Hypothalamic-Pituitary-Adrenal), triggering cortisol release. Chronic stress can impair hippocampal memory formation and prefrontal decision-making.",
    protectiveFunction: "Stress is your brain mobilizing resources to meet demands. Short-term stress can enhance performance; it's a signal to take action.",
    neurotransmitters: ["Cortisol", "Adrenaline", "CRH (Corticotropin-releasing hormone)"],
  },
  {
    emotion: "Confused",
    primaryRegion: "Prefrontal Cortex",
    secondaryRegions: ["Anterior Cingulate Cortex", "Parietal Cortex"],
    process: "Confusion arises when the prefrontal cortex encounters conflicting information or gaps in understanding. The anterior cingulate cortex detects cognitive conflict and signals the need for more information.",
    protectiveFunction: "Confusion is your brain recognizing that it needs more information before acting. It's a healthy pause before decision-making.",
    neurotransmitters: ["Acetylcholine", "Dopamine (seeking)"],
  },
  {
    emotion: "Hopeful",
    primaryRegion: "Nucleus Accumbens",
    secondaryRegions: ["Prefrontal Cortex", "Ventral Tegmental Area"],
    process: "Hope activates the brain's reward circuitry, releasing dopamine in anticipation of positive outcomes. The prefrontal cortex engages in future-oriented thinking and planning.",
    protectiveFunction: "Hope is your brain's forward-looking motivation system. It sustains effort and resilience in the face of challenges.",
    neurotransmitters: ["Dopamine", "Serotonin", "Oxytocin"],
  },
  {
    emotion: "Frustrated",
    primaryRegion: "Amygdala",
    secondaryRegions: ["Prefrontal Cortex", "Basal Ganglia"],
    process: "Frustration occurs when goal-directed behavior is blocked. The basal ganglia, involved in habit and reward, signals that expected outcomes aren't being achieved, triggering amygdala activation.",
    protectiveFunction: "Frustration is your brain signaling that a current approach isn't working. It's an invitation to pause, reassess, and try a different strategy.",
    neurotransmitters: ["Dopamine (blocked)", "Norepinephrine", "Cortisol"],
  },
  {
    emotion: "Disconnected",
    primaryRegion: "Default Mode Network",
    secondaryRegions: ["Prefrontal Cortex", "Insula", "Temporal-Parietal Junction"],
    process: "Feelings of disconnection involve reduced activity in social brain networks. The insula, which processes interoception and social feelings, shows altered activation patterns.",
    protectiveFunction: "Disconnection can be a protective response to emotional pain or overstimulation. Your brain is creating space to recover.",
    neurotransmitters: ["Oxytocin (reduced)", "Serotonin (reduced)", "Endorphins (reduced)"],
  },
  {
    emotion: "Grateful",
    primaryRegion: "Medial Prefrontal Cortex",
    secondaryRegions: ["Anterior Cingulate Cortex", "Nucleus Accumbens"],
    process: "Gratitude activates the medial prefrontal cortex and reward circuits, releasing dopamine and serotonin. Regular gratitude practice can strengthen these neural pathways over time.",
    protectiveFunction: "Gratitude is your brain recognizing abundance and positive connection. It builds resilience and strengthens social bonds.",
    neurotransmitters: ["Dopamine", "Serotonin", "Oxytocin"],
  },
  {
    emotion: "Numb",
    primaryRegion: "Default Mode Network",
    secondaryRegions: ["Amygdala", "Insula"],
    process: "Numbness reflects a low-activation, protective shutdown: amygdala reactivity is dampened and interoceptive signals from the insula are muted, reducing how strongly emotions are felt.",
    protectiveFunction: "Numbness is your brain shielding you from emotional overload. It creates distance from pain when the intensity would otherwise be too much to process at once.",
    neurotransmitters: ["Endorphins", "Serotonin (reduced)", "Dopamine (reduced)"],
  },
  {
    emotion: "Discouraged",
    primaryRegion: "Nucleus Accumbens",
    secondaryRegions: ["Prefrontal Cortex", "Ventral Tegmental Area"],
    process: "Discouragement is linked to reduced dopamine signaling in the brain's reward circuitry, reinforcing negative-outcome loops and making sustained effort feel harder to justify.",
    protectiveFunction: "Discouragement is your brain conserving energy after effort hasn't paid off as hoped. It's a signal to reassess, not a verdict on your ability.",
    neurotransmitters: ["Dopamine (reduced)", "Cortisol"],
  },
  {
    emotion: "Hopeful But Uncertain",
    primaryRegion: "Nucleus Accumbens",
    secondaryRegions: ["Prefrontal Cortex", "Amygdala"],
    process: "This state activates reward circuitry around a positive possibility while the amygdala stays mildly engaged around the unknown, producing a balanced but unsettled mix of anticipation and caution.",
    protectiveFunction: "This mix of hope and uncertainty is your brain holding space for growth while staying alert to risk. It's forward motion that hasn't fully steadied yet.",
    neurotransmitters: ["Dopamine", "Norepinephrine (mild)", "Serotonin"],
  },
];

/**
 * Get the brain-emotion mapping for a specific emotion.
 * Returns the closest match or a generic entry if not found.
 */
export function getBrainEmotionEntry(emotion: string): BrainEmotionEntry | undefined {
  const normalized = emotion.toLowerCase().trim();
  return BRAIN_EMOTION_MAP.find(
    (entry) => entry.emotion.toLowerCase() === normalized
  );
}

/**
 * Get a formatted brain insight string for use in AI prompts.
 */
export function getBrainInsightContext(emotion: string): string {
  const entry = getBrainEmotionEntry(emotion);
  if (!entry) {
    return `The brain's limbic system and prefrontal cortex are involved in processing this emotional state. This is your brain trying to protect you, not a failure.`;
  }
  return `Primary brain region: ${entry.primaryRegion}. Also involves: ${entry.secondaryRegions.join(", ")}. ${entry.process} Key neurotransmitters: ${entry.neurotransmitters.join(", ")}. Protective function: ${entry.protectiveFunction}`;
}
