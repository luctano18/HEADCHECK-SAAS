// ─── HeadCheck AI — EI Quiz Data ─────────────────────────────────────────────
// 25 questions across 5 EI pillars (5 per pillar)
// Each question has 4 options scored 1-4 (1 = low EI, 4 = high EI)

export type QuizOption = {
  id: string;
  text: string;
  score: number; // 1-4
};

export type QuizQuestion = {
  id: string;
  pillar: EIPillar;
  pillarLabel: string;
  text: string;
  scenario?: string; // optional situational context
  options: QuizOption[];
};

export type EIPillar =
  | "self-awareness"
  | "self-regulation"
  | "motivation"
  | "empathy"
  | "social-skills";

export const EI_PILLAR_LABELS: Record<EIPillar, string> = {
  "self-awareness": "Self-Awareness",
  "self-regulation": "Self-Regulation",
  motivation: "Motivation",
  empathy: "Empathy",
  "social-skills": "Social Skills",
};

export const EI_PILLAR_DESCRIPTIONS: Record<EIPillar, string> = {
  "self-awareness":
    "The ability to recognize and understand your own emotions, strengths, weaknesses, values, and how they affect others.",
  "self-regulation":
    "The ability to manage your emotions and impulses, adapt to changing circumstances, and think before acting.",
  motivation:
    "The drive to pursue goals with energy and persistence, beyond external rewards — rooted in inner purpose.",
  empathy:
    "The ability to understand the emotional makeup of others and treat them according to their emotional reactions.",
  "social-skills":
    "Proficiency in managing relationships, building networks, and finding common ground to build rapport.",
};

export const EI_PILLAR_COLORS: Record<EIPillar, string> = {
  "self-awareness": "#7C3AED", // violet
  "self-regulation": "#2563EB", // blue
  motivation: "#D97706", // amber
  empathy: "#DC2626", // rose
  "social-skills": "#059669", // emerald
};

export const EI_PILLAR_ICONS: Record<EIPillar, string> = {
  "self-awareness": "🪞",
  "self-regulation": "🧘",
  motivation: "🔥",
  empathy: "💛",
  "social-skills": "🤝",
};

export const EI_QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── Self-Awareness (SA) ─────────────────────────────────────────────────────
  {
    id: "sa1",
    pillar: "self-awareness",
    pillarLabel: "Self-Awareness",
    text: "When you feel a strong emotion, how quickly do you recognize what it is?",
    options: [
      { id: "sa1a", text: "I rarely notice until much later", score: 1 },
      { id: "sa1b", text: "Sometimes I notice, but I'm often unsure", score: 2 },
      { id: "sa1c", text: "I usually recognize it fairly quickly", score: 3 },
      { id: "sa1d", text: "I notice it almost immediately and can name it precisely", score: 4 },
    ],
  },
  {
    id: "sa2",
    pillar: "self-awareness",
    pillarLabel: "Self-Awareness",
    text: "How well do you understand how your emotions affect your behavior and decisions?",
    options: [
      { id: "sa2a", text: "I rarely make that connection", score: 1 },
      { id: "sa2b", text: "I sometimes see the link, but mostly after the fact", score: 2 },
      { id: "sa2c", text: "I often understand the connection in the moment", score: 3 },
      { id: "sa2d", text: "I consistently track how my emotions shape my choices", score: 4 },
    ],
  },
  {
    id: "sa3",
    pillar: "self-awareness",
    pillarLabel: "Self-Awareness",
    scenario: "A colleague gives you critical feedback on your work.",
    text: "What is your first internal reaction?",
    options: [
      { id: "sa3a", text: "I feel defensive and dismiss it", score: 1 },
      { id: "sa3b", text: "I feel hurt but try not to show it", score: 2 },
      { id: "sa3c", text: "I notice discomfort but stay open to the message", score: 3 },
      { id: "sa3d", text: "I welcome it as useful data about myself", score: 4 },
    ],
  },
  {
    id: "sa4",
    pillar: "self-awareness",
    pillarLabel: "Self-Awareness",
    text: "How accurately do you think others perceive you compared to how you see yourself?",
    options: [
      { id: "sa4a", text: "I think there's a big gap — others often misread me", score: 1 },
      { id: "sa4b", text: "There's some gap, but I'm not sure where", score: 2 },
      { id: "sa4c", text: "I have a reasonable sense of how I come across", score: 3 },
      { id: "sa4d", text: "I actively seek feedback to calibrate my self-perception", score: 4 },
    ],
  },
  {
    id: "sa5",
    pillar: "self-awareness",
    pillarLabel: "Self-Awareness",
    text: "When you make a mistake, how do you typically respond internally?",
    options: [
      { id: "sa5a", text: "I blame others or external circumstances", score: 1 },
      { id: "sa5b", text: "I feel ashamed and try to forget it quickly", score: 2 },
      { id: "sa5c", text: "I acknowledge it and feel some discomfort", score: 3 },
      { id: "sa5d", text: "I reflect on it honestly and use it as a learning opportunity", score: 4 },
    ],
  },

  // ── Self-Regulation (SR) ────────────────────────────────────────────────────
  {
    id: "sr1",
    pillar: "self-regulation",
    pillarLabel: "Self-Regulation",
    text: "When you feel overwhelmed or stressed, what do you typically do?",
    options: [
      { id: "sr1a", text: "I react immediately — I can't hold it in", score: 1 },
      { id: "sr1b", text: "I try to suppress it, but it leaks out", score: 2 },
      { id: "sr1c", text: "I pause and use a calming strategy most of the time", score: 3 },
      { id: "sr1d", text: "I consistently manage my response and choose how to act", score: 4 },
    ],
  },
  {
    id: "sr2",
    pillar: "self-regulation",
    pillarLabel: "Self-Regulation",
    scenario: "You're in a heated argument and the other person says something hurtful.",
    text: "What do you do?",
    options: [
      { id: "sr2a", text: "I say something equally hurtful back", score: 1 },
      { id: "sr2b", text: "I go silent and withdraw", score: 2 },
      { id: "sr2c", text: "I take a breath and try to de-escalate", score: 3 },
      { id: "sr2d", text: "I calmly name what happened and express how I feel", score: 4 },
    ],
  },
  {
    id: "sr3",
    pillar: "self-regulation",
    pillarLabel: "Self-Regulation",
    text: "How do you handle unexpected changes to your plans?",
    options: [
      { id: "sr3a", text: "I get very frustrated and struggle to adapt", score: 1 },
      { id: "sr3b", text: "I feel stressed but eventually adjust", score: 2 },
      { id: "sr3c", text: "I adapt fairly well after an initial reaction", score: 3 },
      { id: "sr3d", text: "I embrace change as a natural part of life", score: 4 },
    ],
  },
  {
    id: "sr4",
    pillar: "self-regulation",
    pillarLabel: "Self-Regulation",
    text: "How often do you act impulsively in ways you later regret?",
    options: [
      { id: "sr4a", text: "Very often — my impulses usually win", score: 1 },
      { id: "sr4b", text: "Sometimes, especially under pressure", score: 2 },
      { id: "sr4c", text: "Rarely — I usually catch myself", score: 3 },
      { id: "sr4d", text: "Almost never — I think before I act", score: 4 },
    ],
  },
  {
    id: "sr5",
    pillar: "self-regulation",
    pillarLabel: "Self-Regulation",
    text: "When you feel anxious about a future event, how do you manage that anxiety?",
    options: [
      { id: "sr5a", text: "I avoid thinking about it or distract myself", score: 1 },
      { id: "sr5b", text: "I worry a lot but don't do much about it", score: 2 },
      { id: "sr5c", text: "I use some strategies (breathing, journaling) to manage it", score: 3 },
      { id: "sr5d", text: "I have reliable practices that help me stay grounded", score: 4 },
    ],
  },

  // ── Motivation (MO) ─────────────────────────────────────────────────────────
  {
    id: "mo1",
    pillar: "motivation",
    pillarLabel: "Motivation",
    text: "What primarily drives you to pursue your goals?",
    options: [
      { id: "mo1a", text: "External rewards like money, status, or approval", score: 1 },
      { id: "mo1b", text: "Avoiding failure or disappointing others", score: 2 },
      { id: "mo1c", text: "A mix of external rewards and personal satisfaction", score: 3 },
      { id: "mo1d", text: "Deep personal values and a sense of purpose", score: 4 },
    ],
  },
  {
    id: "mo2",
    pillar: "motivation",
    pillarLabel: "Motivation",
    scenario: "You face a significant setback on a project you care about.",
    text: "How do you respond?",
    options: [
      { id: "mo2a", text: "I give up — it's not worth the effort", score: 1 },
      { id: "mo2b", text: "I feel discouraged and take a long time to recover", score: 2 },
      { id: "mo2c", text: "I feel disappointed but find a way to continue", score: 3 },
      { id: "mo2d", text: "I see it as information and adjust my approach with renewed energy", score: 4 },
    ],
  },
  {
    id: "mo3",
    pillar: "motivation",
    pillarLabel: "Motivation",
    text: "How do you feel about doing tasks that are challenging but meaningful?",
    options: [
      { id: "mo3a", text: "I prefer easier tasks — challenge feels threatening", score: 1 },
      { id: "mo3b", text: "I tolerate challenge but don't seek it out", score: 2 },
      { id: "mo3c", text: "I generally enjoy meaningful challenges", score: 3 },
      { id: "mo3d", text: "I actively seek out challenging work that aligns with my purpose", score: 4 },
    ],
  },
  {
    id: "mo4",
    pillar: "motivation",
    pillarLabel: "Motivation",
    text: "How consistent are you in working toward long-term goals even when progress is slow?",
    options: [
      { id: "mo4a", text: "I give up quickly if I don't see fast results", score: 1 },
      { id: "mo4b", text: "I struggle to maintain momentum over time", score: 2 },
      { id: "mo4c", text: "I stay fairly consistent with occasional dips", score: 3 },
      { id: "mo4d", text: "I maintain steady effort even through long plateaus", score: 4 },
    ],
  },
  {
    id: "mo5",
    pillar: "motivation",
    pillarLabel: "Motivation",
    text: "When you achieve a goal, what do you feel most?",
    options: [
      { id: "mo5a", text: "Relief that it's over", score: 1 },
      { id: "mo5b", text: "Satisfaction, but I quickly move on without reflection", score: 2 },
      { id: "mo5c", text: "Pride and a desire to build on the success", score: 3 },
      { id: "mo5d", text: "Deep fulfillment and clarity about what matters next", score: 4 },
    ],
  },

  // ── Empathy (EM) ────────────────────────────────────────────────────────────
  {
    id: "em1",
    pillar: "empathy",
    pillarLabel: "Empathy",
    text: "When a friend shares a problem with you, what is your first instinct?",
    options: [
      { id: "em1a", text: "To offer a solution immediately", score: 1 },
      { id: "em1b", text: "To relate it to a similar experience I had", score: 2 },
      { id: "em1c", text: "To listen and ask what they need from me", score: 3 },
      { id: "em1d", text: "To fully tune in to their emotional experience before anything else", score: 4 },
    ],
  },
  {
    id: "em2",
    pillar: "empathy",
    pillarLabel: "Empathy",
    text: "How comfortable are you sitting with someone else's pain without trying to fix it?",
    options: [
      { id: "em2a", text: "Very uncomfortable — I need to do something", score: 1 },
      { id: "em2b", text: "Somewhat uncomfortable, but I try", score: 2 },
      { id: "em2c", text: "Fairly comfortable — I can hold space", score: 3 },
      { id: "em2d", text: "Very comfortable — presence is my gift to them", score: 4 },
    ],
  },
  {
    id: "em3",
    pillar: "empathy",
    pillarLabel: "Empathy",
    scenario: "Someone reacts strongly to something you said, but you didn't mean any harm.",
    text: "What do you do?",
    options: [
      { id: "em3a", text: "Defend myself — I didn't mean it that way", score: 1 },
      { id: "em3b", text: "Apologize briefly and move on", score: 2 },
      { id: "em3c", text: "Try to understand their perspective and acknowledge their feeling", score: 3 },
      { id: "em3d", text: "Genuinely explore how my words landed and what they needed", score: 4 },
    ],
  },
  {
    id: "em4",
    pillar: "empathy",
    pillarLabel: "Empathy",
    text: "How well can you read the emotional state of people around you without them saying anything?",
    options: [
      { id: "em4a", text: "I rarely notice unless someone tells me directly", score: 1 },
      { id: "em4b", text: "I sometimes pick up on obvious cues", score: 2 },
      { id: "em4c", text: "I'm fairly attuned to the emotional atmosphere", score: 3 },
      { id: "em4d", text: "I'm highly sensitive to subtle shifts in others' emotions", score: 4 },
    ],
  },
  {
    id: "em5",
    pillar: "empathy",
    pillarLabel: "Empathy",
    text: "When you disagree with someone, how much effort do you make to understand their point of view?",
    options: [
      { id: "em5a", text: "Very little — I focus on making my case", score: 1 },
      { id: "em5b", text: "Some, but mostly to find holes in their argument", score: 2 },
      { id: "em5c", text: "I genuinely try to understand before responding", score: 3 },
      { id: "em5d", text: "I actively seek to understand their full perspective, even if I disagree", score: 4 },
    ],
  },

  // ── Social Skills (SS) ──────────────────────────────────────────────────────
  {
    id: "ss1",
    pillar: "social-skills",
    pillarLabel: "Social Skills",
    text: "How do you typically handle conflict in a group or team setting?",
    options: [
      { id: "ss1a", text: "I avoid it or let it escalate", score: 1 },
      { id: "ss1b", text: "I try to smooth things over without addressing the real issue", score: 2 },
      { id: "ss1c", text: "I address it directly but sometimes struggle with delivery", score: 3 },
      { id: "ss1d", text: "I facilitate open dialogue that leads to genuine resolution", score: 4 },
    ],
  },
  {
    id: "ss2",
    pillar: "social-skills",
    pillarLabel: "Social Skills",
    text: "How effective are you at building trust with new people?",
    options: [
      { id: "ss2a", text: "I find it very difficult — people rarely open up to me", score: 1 },
      { id: "ss2b", text: "It takes a long time and I'm not sure how to speed it up", score: 2 },
      { id: "ss2c", text: "I build trust reasonably well through consistency", score: 3 },
      { id: "ss2d", text: "I naturally create environments where people feel safe and valued", score: 4 },
    ],
  },
  {
    id: "ss3",
    pillar: "social-skills",
    pillarLabel: "Social Skills",
    scenario: "You need to deliver difficult news to someone you care about.",
    text: "How do you approach it?",
    options: [
      { id: "ss3a", text: "I avoid it as long as possible or delegate it", score: 1 },
      { id: "ss3b", text: "I do it quickly to get it over with", score: 2 },
      { id: "ss3c", text: "I plan what to say and consider their feelings", score: 3 },
      { id: "ss3d", text: "I choose the right moment, frame it with care, and stay present for their reaction", score: 4 },
    ],
  },
  {
    id: "ss4",
    pillar: "social-skills",
    pillarLabel: "Social Skills",
    text: "How well do you adapt your communication style to different people?",
    options: [
      { id: "ss4a", text: "I communicate the same way with everyone", score: 1 },
      { id: "ss4b", text: "I make minor adjustments but mostly stick to my style", score: 2 },
      { id: "ss4c", text: "I consciously adjust based on the person and context", score: 3 },
      { id: "ss4d", text: "I naturally mirror and adapt to make every interaction effective", score: 4 },
    ],
  },
  {
    id: "ss5",
    pillar: "social-skills",
    pillarLabel: "Social Skills",
    text: "When working in a team, how do you contribute to the group's emotional climate?",
    options: [
      { id: "ss5a", text: "I focus on my own work and don't think much about the group dynamic", score: 1 },
      { id: "ss5b", text: "I try not to be a negative influence", score: 2 },
      { id: "ss5c", text: "I actively support team morale and collaboration", score: 3 },
      { id: "ss5d", text: "I intentionally cultivate psychological safety and positive energy", score: 4 },
    ],
  },
];

// ── Scoring Logic ──────────────────────────────────────────────────────────────

export type PillarScores = {
  selfAwareness: number; // 0-100
  selfRegulation: number;
  motivation: number;
  empathy: number;
  socialSkills: number;
  total: number;
};

export type EILevel = "Emerging" | "Developing" | "Proficient" | "Advanced" | "Exceptional";

export function calculatePillarScores(answers: Record<string, number>): PillarScores {
  const pillarMap: Record<EIPillar, string[]> = {
    "self-awareness": ["sa1", "sa2", "sa3", "sa4", "sa5"],
    "self-regulation": ["sr1", "sr2", "sr3", "sr4", "sr5"],
    motivation: ["mo1", "mo2", "mo3", "mo4", "mo5"],
    empathy: ["em1", "em2", "em3", "em4", "em5"],
    "social-skills": ["ss1", "ss2", "ss3", "ss4", "ss5"],
  };

  const maxPerPillar = 5 * 4; // 5 questions × max score 4 = 20

  const getRaw = (ids: string[]) =>
    ids.reduce((sum, id) => sum + (answers[id] ?? 0), 0);

  const toPercent = (raw: number) => Math.round((raw / maxPerPillar) * 100);

  const sa = toPercent(getRaw(pillarMap["self-awareness"]));
  const sr = toPercent(getRaw(pillarMap["self-regulation"]));
  const mo = toPercent(getRaw(pillarMap["motivation"]));
  const em = toPercent(getRaw(pillarMap["empathy"]));
  const ss = toPercent(getRaw(pillarMap["social-skills"]));

  const total = Math.round((sa + sr + mo + em + ss) / 5);

  return { selfAwareness: sa, selfRegulation: sr, motivation: mo, empathy: em, socialSkills: ss, total };
}

export function getEILevel(totalScore: number): EILevel {
  if (totalScore >= 90) return "Exceptional";
  if (totalScore >= 75) return "Advanced";
  if (totalScore >= 55) return "Proficient";
  if (totalScore >= 35) return "Developing";
  return "Emerging";
}

export const EI_LEVEL_DESCRIPTIONS: Record<EILevel, { headline: string; description: string; color: string }> = {
  Emerging: {
    headline: "Beginning Your EI Journey",
    description:
      "You're at the start of a meaningful path. Emotional intelligence is a skill that grows with practice and self-reflection. Every step you take toward understanding yourself matters.",
    color: "#94A3B8",
  },
  Developing: {
    headline: "Building Emotional Awareness",
    description:
      "You're developing your emotional vocabulary and beginning to connect your feelings to your actions. With consistent practice, your EI will deepen significantly.",
    color: "#60A5FA",
  },
  Proficient: {
    headline: "Emotionally Grounded",
    description:
      "You have a solid foundation in emotional intelligence. You understand your emotions, manage them reasonably well, and show genuine empathy for others.",
    color: "#34D399",
  },
  Advanced: {
    headline: "Emotionally Intelligent Leader",
    description:
      "You demonstrate strong emotional intelligence across most areas. You're able to navigate complex emotional landscapes and positively influence those around you.",
    color: "#A78BFA",
  },
  Exceptional: {
    headline: "Emotionally Masterful",
    description:
      "You exhibit exceptional emotional intelligence. You lead with empathy, regulate with grace, and inspire others through your authentic presence and deep self-awareness.",
    color: "#F59E0B",
  },
};
