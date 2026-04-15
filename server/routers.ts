import { TRPCError } from "@trpc/server";
import { authEmailRouter } from "./routers/authEmail";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  acceptInvitation,
  completeSevenMirrorsSession,
  createCheckIn,
  createCrisisEvent,
  createGroup,
  createInstitution,
  createInvitation,
  createSevenMirrorsSession,
  getActiveSevenMirrorsSession,
  getAiResponseByCheckIn,
  getCheckInById,
  getCheckInsByUser,
  getCohortCheckInTrends,
  getCohortEngagement,
  getCompletedSevenMirrorsSessions,
  getCrisisEventsByInstitution,
  getGroupsByInstitution,
  getInstitutionByAdminId,
  getInstitutionById,
  getInvitationByToken,
  getRecentAiResponses,
  getSevenMirrorsResponsesBySession,
  getSevenMirrorsSessionById,
  saveAiResponse,
  saveSevenMirrorsResponse,
  updateUserOnboarding,
  updateUserStreak,
  getUserStreak,
  getUserAchievements,
  createCoachingSession,
  getCoachingSessionsByUser,
  createQuizAttempt,
  getQuizAttemptsByUser,
  getLatestQuizAttempt,
  getMoodTrendByUser,
  getMoodStatsByUser,
  getAvailableEmotions,
  createViolenceFlag,
  getViolenceFlagsByUser,
  getViolenceFlagsByInstitution,
  acknowledgeViolenceFlag,
  getSafetyPlanByUser,
  upsertSafetyPlan,
  getAllCheckInTrends,
  getAllEngagement,
  getAllCrisisEvents,
  getAllViolenceFlags,
  getAllGroups,
  resolveCrisisEvent,
  getGroupMemberCounts,
  getCrisisEventById,
  getViolenceFlagById,
  getAlertActions,
  addAlertAction,
  assignCrisisAlert,
  assignViolenceFlag,
  getTeamMembers,
  getMyCrisisAssignments,
  getMyViolenceAssignments,
  getUserById,
  getAlertComments,
  addAlertComment,
  deleteAlertComment,
  editAlertComment,
} from "./db";
import {
  EI_QUIZ_QUESTIONS,
  calculatePillarScores,
  getEILevel,
} from "../shared/eiQuizData";

// ─── Crisis Detection ─────────────────────────────────────────────────────────
// Self-harm / suicidal ideation keywords
const CRISIS_KEYWORDS_CRITICAL = [
  "kill myself", "suicide", "end my life", "want to die", "don't want to live",
  "hurt myself", "self-harm", "cutting myself", "overdose", "jump off",
  "me suicider", "me tuer", "en finir", "mettre fin à ma vie",
];
const CRISIS_KEYWORDS_HIGH = [
  "hopeless", "worthless", "can't go on", "no reason to live", "disappear",
  "nobody cares", "better off dead", "give up on life", "can't take it anymore",
  "sans espoir", "inutile", "plus de raison", "tout abandonner",
];
const CRISIS_KEYWORDS_MODERATE = [
  "depressed", "anxious", "overwhelmed", "can't cope", "breaking down",
  "falling apart", "losing control", "panic", "terrified",
  "déprimé", "débordé", "plus capable", "effondré",
];

// Violence toward others keywords
export const VIOLENCE_KEYWORDS_CRITICAL = [
  "kill them", "kill him", "kill her", "murder", "want to hurt", "going to hurt",
  "attack them", "weapon", "gun", "knife", "stab",
  "les tuer", "le tuer", "la tuer", "les blesser", "arme", "couteau", "pistolet",
  "frapper fort", "faire du mal à",
];
export const VIOLENCE_KEYWORDS_HIGH = [
  "want to fight", "going to fight", "hurt someone", "make them pay",
  "destroy them", "beat them up", "threaten", "revenge",
  "se battre", "blesser quelqu'un", "leur faire payer", "vengeance", "menacer",
  "les frapper",
];
export const VIOLENCE_KEYWORDS_MODERATE = [
  "so angry at", "rage toward", "violent thoughts", "can't control my anger",
  "want to scream at", "furious at",
  "tellement en colère contre", "pensées violentes", "rage envers",
  "incontrôlable", "furieux contre",
];

export type DetectionResult = {
  detected: boolean;
  severity: "moderate" | "high" | "critical" | null;
  type: "self_harm" | "violence_toward_others" | null;
};

export function detectCrisis(text: string, intensity: number): { detected: boolean; severity: "moderate" | "high" | "critical" | null } {
  const lower = text.toLowerCase();
  if (CRISIS_KEYWORDS_CRITICAL.some((k) => lower.includes(k))) return { detected: true, severity: "critical" };
  if (CRISIS_KEYWORDS_HIGH.some((k) => lower.includes(k)) || intensity >= 9) return { detected: true, severity: "high" };
  if (CRISIS_KEYWORDS_MODERATE.some((k) => lower.includes(k)) && intensity >= 7) return { detected: true, severity: "moderate" };
  return { detected: false, severity: null };
}

export function detectViolence(text: string, intensity: number): DetectionResult {
  const lower = text.toLowerCase();
  // Check violence toward others first
  if (VIOLENCE_KEYWORDS_CRITICAL.some((k) => lower.includes(k))) return { detected: true, severity: "critical", type: "violence_toward_others" };
  if (VIOLENCE_KEYWORDS_HIGH.some((k) => lower.includes(k))) return { detected: true, severity: "high", type: "violence_toward_others" };
  if (VIOLENCE_KEYWORDS_MODERATE.some((k) => lower.includes(k)) && intensity >= 7) return { detected: true, severity: "moderate", type: "violence_toward_others" };
  // Check self-harm
  const selfHarm = detectCrisis(text, intensity);
  if (selfHarm.detected) return { detected: true, severity: selfHarm.severity, type: "self_harm" };
  return { detected: false, severity: null, type: null };
}

// ─── AI Response Engine ───────────────────────────────────────────────────────
async function generateAiResponse(params: {
  emotion: string;
  intensity: number;
  context: string;
  journalEntry?: string;
}) {
  const { emotion, intensity, context, journalEntry } = params;
  const prompt = `You are HeadCheck AI, a compassionate emotional wellness assistant that integrates neuroscience, Emotional Intelligence (EI), and African-Inspired Emotional Intelligence (AIEI).

A user is experiencing: Emotion: "${emotion}" | Intensity: ${intensity}/10 | Context: ${context}
${journalEntry ? `Journal: "${journalEntry}"` : ""}

Generate a structured JSON response with EXACTLY these 7 fields:
1. "emotionalReflection": A warm, validating 2-3 sentence reflection on what the user is feeling. Use a compassionate, non-judgmental tone.
2. "brainInsight": A 2-sentence neuroscience explanation of what's happening in the brain (mention specific brain regions like amygdala, prefrontal cortex, hippocampus, etc.).
3. "eiPillar": The most relevant EI pillar name (one of: Self-Awareness, Self-Regulation, Motivation, Empathy, Social Skills).
4. "eiPillarDescription": A 2-sentence explanation of how this EI pillar applies to their current state and what growth looks like.
5. "aieiProverb": An authentic African proverb relevant to their situation.
6. "aieiProverbOrigin": The country or culture of origin for the proverb (e.g., "Yoruba, Nigeria" or "Swahili, East Africa").
7. "personalizedNextStep": A specific, actionable 2-3 sentence recommendation for their immediate next step.
8. "supportInvitation": A gentle 1-2 sentence invitation to seek additional support if needed.
9. "mochaAffirmation": A short, powerful 1-sentence affirmation from Mocha (the HeadCheck AI companion) that the user can carry with them. Make it personal, warm, and rooted in their specific emotional state.
Respond ONLY with valid JSON, no markdown.`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "headcheck_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            emotionalReflection: { type: "string" },
            brainInsight: { type: "string" },
            eiPillar: { type: "string" },
            eiPillarDescription: { type: "string" },
            aieiProverb: { type: "string" },
            aieiProverbOrigin: { type: "string" },
            personalizedNextStep: { type: "string" },
            supportInvitation: { type: "string" },
            mochaAffirmation: { type: "string" },
          },
          required: ["emotionalReflection", "brainInsight", "eiPillar", "eiPillarDescription", "aieiProverb", "aieiProverbOrigin", "personalizedNextStep", "supportInvitation", "mochaAffirmation"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : null;
  if (!content) throw new Error("No AI response generated");
  return JSON.parse(content) as {
    emotionalReflection: string;
    brainInsight: string;
    eiPillar: string;
    eiPillarDescription: string;
    aieiProverb: string;
    aieiProverbOrigin: string;
    personalizedNextStep: string;
    supportInvitation: string;
    mochaAffirmation: string;
  };
}
// ─── Seven Mirrors AI Summaryy ─────────────────────────────────────────────────
const SEVEN_MIRRORS = ["Values", "Loyalty", "Inner Conflict", "Self-Appreciation", "Red Flags", "Growth", "Peace"];

async function generateSevenMirrorsSummary(responses: { mirrorTheme: string; response: string }[]) {
  const responsesText = responses.map((r) => `${r.mirrorTheme}: "${r.response}"`).join("\n");
  const prompt = `You are HeadCheck AI. A user has completed the Seven Mirrors deep reflection journey.

Their responses:
${responsesText}

Generate a JSON with:
1. "summary": A 3-4 paragraph compassionate, insightful summary of their inner journey, highlighting patterns, strengths, and areas for growth.
2. "badges": An array of exactly 7 badge names (one per mirror theme), each being a short, empowering title (2-4 words) that captures their response to that mirror. Examples: "Values Champion", "Loyal Heart", "Conflict Navigator", "Self-Love Seeker", "Boundary Setter", "Growth Seeker", "Inner Peace".

Respond ONLY with valid JSON.`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "seven_mirrors_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            badges: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "badges"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : null;
  if (!content) throw new Error("No AI summary generated");
  return JSON.parse(content) as { summary: string; badges: string[] };
}

// ─── EI Quiz AI Insight Generator ──────────────────────────────────────────────
async function generateQuizInsight(scores: {
  selfAwareness: number;
  selfRegulation: number;
  motivation: number;
  empathy: number;
  socialSkills: number;
  total: number;
}, level: string): Promise<string> {
  const pillarLines = [
    `Self-Awareness: ${scores.selfAwareness}%`,
    `Self-Regulation: ${scores.selfRegulation}%`,
    `Motivation: ${scores.motivation}%`,
    `Empathy: ${scores.empathy}%`,
    `Social Skills: ${scores.socialSkills}%`,
  ].join(", ");

  const strongest = Object.entries({
    "Self-Awareness": scores.selfAwareness,
    "Self-Regulation": scores.selfRegulation,
    "Motivation": scores.motivation,
    "Empathy": scores.empathy,
    "Social Skills": scores.socialSkills,
  }).sort((a, b) => b[1] - a[1])[0][0];

  const weakest = Object.entries({
    "Self-Awareness": scores.selfAwareness,
    "Self-Regulation": scores.selfRegulation,
    "Motivation": scores.motivation,
    "Empathy": scores.empathy,
    "Social Skills": scores.socialSkills,
  }).sort((a, b) => a[1] - b[1])[0][0];

  const prompt = `You are Mocha, the HeadCheck AI companion — warm, insightful, and grounded in African wisdom.

A user just completed the Emotional Intelligence (EI) Quiz. Here are their results:
- Overall EI Level: ${level} (${scores.total}%)
- Pillar Scores: ${pillarLines}
- Strongest pillar: ${strongest}
- Area with most growth potential: ${weakest}

Write a personalized 3-paragraph insight that:
1. Celebrates their overall EI level with warmth and specificity (mention their strongest pillar)
2. Offers a compassionate, growth-focused reflection on their area of development (${weakest})
3. Ends with an empowering African proverb relevant to their journey, with its origin

Keep the tone warm, honest, and empowering — like a wise mentor who sees their full potential. Do not use bullet points. Write in flowing paragraphs.`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : "Your emotional intelligence journey is uniquely yours. Keep exploring, keep growing.";
  } catch {
    return "Your emotional intelligence journey is uniquely yours. Keep exploring, keep growing.";
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Email/password auth procedures
    register: authEmailRouter.register,
    loginEmail: authEmailRouter.loginEmail,
    forgotPassword: authEmailRouter.forgotPassword,
    resetPassword: authEmailRouter.resetPassword,
    changePassword: authEmailRouter.changePassword,
    verifyEmail: authEmailRouter.verifyEmail,
    checkEmailAvailable: authEmailRouter.checkEmailAvailable,
    getEmailVerifiedStatus: authEmailRouter.getEmailVerifiedStatus,
  }),

  // ─── Onboarding ─────────────────────────────────────────────────────────────
  onboarding: router({
    complete: protectedProcedure
      .input(z.object({
        role: z.enum(["student", "facilitator", "admin"]),
        institutionName: z.string().optional(),
        invitationToken: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        if (input.role === "admin" && input.institutionName) {
          await createInstitution(input.institutionName, userId);
          const inst = await getInstitutionByAdminId(userId);
          await updateUserOnboarding(userId, { role: "admin", institutionId: inst?.id, onboardingCompleted: true });
        } else if (input.invitationToken) {
          const inv = await getInvitationByToken(input.invitationToken);
          if (!inv || inv.accepted || inv.expiresAt < new Date()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired invitation" });
          }
          await acceptInvitation(input.invitationToken);
          await updateUserOnboarding(userId, {
            role: input.role,
            institutionId: inv.institutionId,
            groupId: inv.groupId ?? undefined,
            onboardingCompleted: true,
          });
        } else {
          await updateUserOnboarding(userId, { role: input.role, onboardingCompleted: true });
        }
        return { success: true };
      }),
  }),

  // ─── Institutions ────────────────────────────────────────────────────────────
  institutions: router({
    getMyInstitution: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.institutionId) return null;
      return getInstitutionById(ctx.user.institutionId);
    }),
    createGroup: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.institutionId) throw new TRPCError({ code: "FORBIDDEN" });
        await createGroup(input.name, ctx.user.institutionId, ctx.user.id);
        return { success: true };
      }),
    getGroups: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.institutionId) {
        // Superadmin sees all groups; other users without institution see empty list
        if (ctx.user.role === "superadmin") return getAllGroups();
        return [];
      }
      return getGroupsByInstitution(ctx.user.institutionId);
    }),
    getGroupsWithCounts: protectedProcedure.query(async ({ ctx }) => {
      const isSuperadmin = ctx.user.role === "superadmin";
      if (!ctx.user.institutionId && !isSuperadmin) return [];
      const groupList = ctx.user.institutionId
        ? await getGroupsByInstitution(ctx.user.institutionId)
        : await getAllGroups();
      const counts = ctx.user.institutionId
        ? await getGroupMemberCounts(ctx.user.institutionId)
        : {};
      return groupList.map((g: any) => ({ ...g, memberCount: counts[g.id] ?? 0 }));
    }),
    inviteStudent: protectedProcedure
      .input(z.object({ email: z.string().email(), groupId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.institutionId) throw new TRPCError({ code: "FORBIDDEN" });
        const token = nanoid(32);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await createInvitation({
          token,
          email: input.email,
          institutionId: ctx.user.institutionId,
          groupId: input.groupId,
          invitedByUserId: ctx.user.id,
          expiresAt,
        });
        return { token, inviteLink: `/join?token=${token}` };
      }),
    acceptInvitation: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const inv = await getInvitationByToken(input.token);
        if (!inv || inv.accepted || inv.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired invitation" });
        }
        await acceptInvitation(input.token);
        await updateUserOnboarding(ctx.user.id, {
          institutionId: inv.institutionId,
          groupId: inv.groupId ?? undefined,
          onboardingCompleted: true,
        });
        return { success: true };
      }),
  }),

  // ─── Check-Ins ───────────────────────────────────────────────────────────────
  checkIns: router({
    // Guest-accessible: generates AI response without saving to DB
    guestCreate: publicProcedure
      .input(z.object({
        emotion: z.string().min(1),
        emotionEmoji: z.string().optional(),
        intensity: z.number().min(1).max(10),
        context: z.enum(["School", "Family", "Relationships", "Work", "Self"]),
        journalEntry: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const crisis = detectCrisis(input.journalEntry ?? "", input.intensity);
        const aiData = await generateAiResponse({
          emotion: input.emotion,
          intensity: input.intensity,
          context: input.context,
          journalEntry: input.journalEntry,
        });
        return { aiResponse: aiData, crisisDetected: crisis.detected, severity: crisis.severity };
      }),

    create: protectedProcedure
      .input(z.object({
        emotion: z.string().min(1),
        emotionEmoji: z.string().optional(),
        intensity: z.number().min(1).max(10),
        context: z.enum(["School", "Family", "Relationships", "Work", "Self"]),
        journalEntry: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const crisis = detectCrisis(input.journalEntry ?? "", input.intensity);

        const checkInId = await createCheckIn({
          userId: ctx.user.id,
          emotion: input.emotion,
          emotionEmoji: input.emotionEmoji,
          intensity: input.intensity,
          context: input.context,
          journalEntry: input.journalEntry,
          crisisDetected: crisis.detected,
        });

        if (crisis.detected && crisis.severity) {
          await createCrisisEvent({
            userId: ctx.user.id,
            checkInId,
            triggerText: input.journalEntry,
            severity: crisis.severity,
          });
        }

        // Generate AI response
        const aiData = await generateAiResponse({
          emotion: input.emotion,
          intensity: input.intensity,
          context: input.context,
          journalEntry: input.journalEntry,
        });

        await saveAiResponse({ checkInId, userId: ctx.user.id, ...aiData });

        // Update streak and check achievements
        const streakData = await updateUserStreak(ctx.user.id);

        return { checkInId, crisisDetected: crisis.detected, severity: crisis.severity, streak: streakData };
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getCheckInsByUser(ctx.user.id, input.limit ?? 20);
      }),

    getWithResponse: protectedProcedure
      .input(z.object({ checkInId: z.number() }))
      .query(async ({ ctx, input }) => {
        const checkIn = await getCheckInById(input.checkInId);
        if (!checkIn || checkIn.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        const aiResponse = await getAiResponseByCheckIn(input.checkInId);
        return { checkIn, aiResponse };
      }),

    detectCrisisRealtime: publicProcedure
      .input(z.object({ text: z.string(), intensity: z.number() }))
      .query(({ input }) => {
        return detectCrisis(input.text, input.intensity);
      }),
  }),

  // ─── Seven Mirrors ───────────────────────────────────────────────────────────────
  sevenMirrors: router({
    // Guest-accessible: generates AI summary without saving to DB
    guestSummary: publicProcedure
      .input(z.object({
        responses: z.array(z.object({
          mirrorTheme: z.string(),
          response: z.string(),
        })).length(7),
      }))
      .mutation(async ({ input }) => {
        return generateSevenMirrorsSummary(input.responses);
      }),

    startSession: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getActiveSevenMirrorsSession(ctx.user.id);
      if (existing) return { sessionId: existing.id, currentMirrorIndex: existing.currentMirrorIndex };
      const sessionId = await createSevenMirrorsSession(ctx.user.id);
      return { sessionId, currentMirrorIndex: 0 };
    }),

    getActiveSession: protectedProcedure.query(async ({ ctx }) => {
      return getActiveSevenMirrorsSession(ctx.user.id);
    }),

    submitMirrorResponse: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        mirrorIndex: z.number().min(0).max(6),
        response: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSevenMirrorsSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });

        await saveSevenMirrorsResponse({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          mirrorIndex: input.mirrorIndex,
          mirrorTheme: SEVEN_MIRRORS[input.mirrorIndex]!,
          response: input.response,
        });

        const isLast = input.mirrorIndex === 6;
        if (isLast) {
          const allResponses = await getSevenMirrorsResponsesBySession(input.sessionId);
          const { summary, badges } = await generateSevenMirrorsSummary(allResponses);
          await completeSevenMirrorsSession(input.sessionId, summary, badges);
          return { completed: true, summary, badges };
        }

        return { completed: false, nextMirrorIndex: input.mirrorIndex + 1 };
      }),

    getCompletedSessions: protectedProcedure.query(async ({ ctx }) => {
      return getCompletedSevenMirrorsSessions(ctx.user.id);
    }),

    getSessionDetails: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSevenMirrorsSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        const responses = await getSevenMirrorsResponsesBySession(input.sessionId);
        return { session, responses };
      }),
  }),
  // ─── User Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    getMoodTrend: protectedProcedure
      .input(z.object({
        days: z.union([z.literal(30), z.literal(90)]).default(30),
        emotion: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getMoodTrendByUser(ctx.user.id, input.days, input.emotion);
      }),
    getMoodStats: protectedProcedure
      .input(z.object({
        days: z.union([z.literal(30), z.literal(90)]).default(30),
        emotion: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getMoodStatsByUser(ctx.user.id, input.days, input.emotion);
      }),
    getAvailableEmotions: protectedProcedure
      .input(z.object({ days: z.union([z.literal(30), z.literal(90)]).default(30) }))
      .query(async ({ ctx, input }) => {
        return getAvailableEmotions(ctx.user.id, input.days);
      }),
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const [checkInList, aiResponseList, mirrorSessions, streak, achievements] = await Promise.all([
        getCheckInsByUser(ctx.user.id, 30),
        getRecentAiResponses(ctx.user.id, 10),
        getCompletedSevenMirrorsSessions(ctx.user.id),
        getUserStreak(ctx.user.id),
        getUserAchievements(ctx.user.id),
      ]);
      return { checkIns: checkInList, aiResponses: aiResponseList, mirrorSessions, streak, achievements };
    }),
  }),
  // ─── Facilitator Dashboard ────────────────────────────────────────────────────
  facilitator: router({
    getCohortTrends: protectedProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        if (!ctx.user.institutionId && !isSuperadmin) throw new TRPCError({ code: "FORBIDDEN" });
        return isSuperadmin && !ctx.user.institutionId
          ? getAllCheckInTrends(input.days ?? 30)
          : getCohortCheckInTrends(ctx.user.institutionId!, input.days ?? 30);
      }),
    getEngagement: protectedProcedure.query(async ({ ctx }) => {
      const isSuperadmin = ctx.user.role === "superadmin";
      if (!ctx.user.institutionId && !isSuperadmin) throw new TRPCError({ code: "FORBIDDEN" });
      return isSuperadmin && !ctx.user.institutionId
        ? getAllEngagement()
        : getCohortEngagement(ctx.user.institutionId!);
    }),
    getCrisisAlerts: protectedProcedure.query(async ({ ctx }) => {
      const isSuperadmin = ctx.user.role === "superadmin";
      if (!ctx.user.institutionId && !isSuperadmin) throw new TRPCError({ code: "FORBIDDEN" });
      return isSuperadmin && !ctx.user.institutionId
        ? getAllCrisisEvents()
        : getCrisisEventsByInstitution(ctx.user.institutionId!);
    }),
    resolveCrisisAlert: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        if (!ctx.user.institutionId && !isSuperadmin) throw new TRPCError({ code: "FORBIDDEN" });
        await resolveCrisisEvent(input.alertId);
        return { success: true };
      }),
  }),

  // ─── Crisis & Violence Prevention ─────────────────────────────────────────────────────────────────────────────────────────
  crisis: router({
    // Real-time combined detection (crisis + violence)
    detectRealtime: publicProcedure
      .input(z.object({ text: z.string(), intensity: z.number() }))
      .query(({ input }) => {
        return detectViolence(input.text, input.intensity);
      }),

    // Report a violence/crisis flag from a check-in
    reportFlag: protectedProcedure
      .input(z.object({
        checkInId: z.number().optional(),
        triggerText: z.string().optional(),
        flagType: z.enum(["self_harm", "violence_toward_others", "crisis"]),
        severity: z.enum(["moderate", "high", "critical"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await createViolenceFlag({
          userId: ctx.user.id,
          checkInId: input.checkInId,
          triggerText: input.triggerText,
          flagType: input.flagType,
          severity: input.severity,
        });
        return { success: true };
      }),

    // Get my violence/crisis flags
    getMyFlags: protectedProcedure.query(async ({ ctx }) => {
      return getViolenceFlagsByUser(ctx.user.id);
    }),

    // Acknowledge a flag (facilitator or superadmin)
    acknowledgeFlag: protectedProcedure
      .input(z.object({ flagId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        if (!ctx.user.institutionId && !isSuperadmin) throw new TRPCError({ code: "FORBIDDEN" });
        await acknowledgeViolenceFlag(input.flagId);
        return { success: true };
      }),

    // Get institution-wide violence flags (facilitator or superadmin)
    getInstitutionFlags: protectedProcedure.query(async ({ ctx }) => {
      const isSuperadmin = ctx.user.role === "superadmin";
      if (!ctx.user.institutionId && !isSuperadmin) throw new TRPCError({ code: "FORBIDDEN" });
      return isSuperadmin && !ctx.user.institutionId
        ? getAllViolenceFlags()
        : getViolenceFlagsByInstitution(ctx.user.institutionId!);
    }),

    // Get my safety plan
    getSafetyPlan: protectedProcedure.query(async ({ ctx }) => {
      return getSafetyPlanByUser(ctx.user.id);
    }),

    // Get a single crisis event detail (facilitator/admin/superadmin)
    getCrisisDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "facilitator";
        if (!isSuperadmin && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const event = await getCrisisEventById(input.id);
        if (!event) throw new TRPCError({ code: "NOT_FOUND" });
        const actions = await getAlertActions("crisis", input.id);
        return { event, actions };
      }),

    // Get a single violence flag detail (facilitator/admin/superadmin)
    getViolenceDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "facilitator";
        if (!isSuperadmin && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const flag = await getViolenceFlagById(input.id);
        if (!flag) throw new TRPCError({ code: "NOT_FOUND" });
        const actions = await getAlertActions("violence", input.id);
        return { flag, actions };
      }),

    // Add an action to an alert (facilitator/admin/superadmin)
    addAction: protectedProcedure
      .input(z.object({
        alertType: z.enum(["crisis", "violence"]),
        alertId: z.number(),
        actionType: z.enum([
          "acknowledged",
          "contacted_student",
          "escalated",
          "referred_to_counselor",
          "resolved",
          "note_added",
          "protocol_initiated",
        ]),
        note: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "facilitator";
        if (!isSuperadmin && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await addAlertAction({
          adminUserId: ctx.user.id,
          alertType: input.alertType,
          crisisEventId: input.alertType === "crisis" ? input.alertId : undefined,
          violenceFlagId: input.alertType === "violence" ? input.alertId : undefined,
          actionType: input.actionType,
          note: input.note,
        });
        return { success: true };
      }),

    // Assign an alert to a team member
    assignAlert: protectedProcedure
      .input(z.object({
        alertType: z.enum(["crisis", "violence"]),
        alertId: z.number().int().positive(),
        assignedToId: z.number().int().positive(),
        note: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "facilitator";
        if (!isSuperadmin && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        // Verify assignee exists
        const assignee = await getUserById(input.assignedToId);
        if (!assignee) throw new TRPCError({ code: "NOT_FOUND", message: "Team member not found" });
        // Perform assignment
        if (input.alertType === "crisis") {
          await assignCrisisAlert(input.alertId, input.assignedToId);
        } else {
          await assignViolenceFlag(input.alertId, input.assignedToId);
        }
        // Log the assignment as an action
        await addAlertAction({
          adminUserId: ctx.user.id,
          alertType: input.alertType,
          crisisEventId: input.alertType === "crisis" ? input.alertId : undefined,
          violenceFlagId: input.alertType === "violence" ? input.alertId : undefined,
          actionType: "assigned",
          note: input.note ?? `Assigned to ${assignee.name ?? assignee.email}`,
        });
        return { success: true, assignee };
      }),

    // Get team members for assignment dropdown
    getTeamMembers: protectedProcedure.query(async ({ ctx }) => {
      const isSuperadmin = ctx.user.role === "superadmin";
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "facilitator";
      if (!isSuperadmin && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return getTeamMembers(ctx.user.institutionId ?? null);
    }),

    // Get alerts assigned to me
    getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
      const crisisAssignments = await getMyCrisisAssignments(ctx.user.id);
      const violenceAssignments = await getMyViolenceAssignments(ctx.user.id);
      return { crisis: crisisAssignments, violence: violenceAssignments };
    }),

    // Save / update my safety plan
    saveSafetyPlan: protectedProcedure
      .input(z.object({
        trustedContacts: z.array(z.object({
          name: z.string(),
          phone: z.string(),
          relation: z.string(),
        })).optional(),
        warningSignals: z.array(z.string()).optional(),
        copingStrategies: z.array(z.string()).optional(),
        safeEnvironments: z.array(z.string()).optional(),
        professionalSupport: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertSafetyPlan({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
  }),

  // ─── Coaching ─────────────────────────────────────────────────────────────────────────────────────────
  coaching: router({
    book: protectedProcedure
      .input(z.object({
        sessionType: z.enum(["30min", "60min", "3session", "organization"]),
        questionnaire: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await createCoachingSession({
          userId: ctx.user.id,
          sessionType: input.sessionType,
          questionnaire: input.questionnaire,
        });
        return session;
      }),
    mySessions: protectedProcedure.query(async ({ ctx }) => {
      return getCoachingSessionsByUser(ctx.user.id);
    }),
  }),

  // ─── EI Quiz ─────────────────────────────────────────────────────────────────
  quiz: router({
    // Get all 25 questions (public — guests can take the quiz too)
    getQuestions: publicProcedure.query(() => {
      return EI_QUIZ_QUESTIONS;
    }),

    // Submit quiz answers — authenticated users get DB persistence
    submit: protectedProcedure
      .input(z.object({
        answers: z.record(z.string(), z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const scores = calculatePillarScores(input.answers);
        const level = getEILevel(scores.total);

        // Generate AI insight
        const aiInsight = await generateQuizInsight(scores, level);

        const attempt = await createQuizAttempt({
          userId: ctx.user.id,
          selfAwarenessScore: scores.selfAwareness,
          selfRegulationScore: scores.selfRegulation,
          motivationScore: scores.motivation,
          empathyScore: scores.empathy,
          socialSkillsScore: scores.socialSkills,
          totalScore: scores.total,
          level,
          answers: input.answers,
          aiInsight,
        });

        return { ...attempt, scores, level, aiInsight };
      }),

    // Guest quiz submission — no DB persistence, returns scores + AI insight
    guestSubmit: publicProcedure
      .input(z.object({
        answers: z.record(z.string(), z.number()),
        guestToken: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const scores = calculatePillarScores(input.answers);
        const level = getEILevel(scores.total);
        const aiInsight = await generateQuizInsight(scores, level);
        return { scores, level, aiInsight, answers: input.answers };
      }),

    // Get quiz history for authenticated user
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return getQuizAttemptsByUser(ctx.user.id);
    }),

    // Get latest quiz attempt for authenticated user
    getLatest: protectedProcedure.query(async ({ ctx }) => {
      return getLatestQuizAttempt(ctx.user.id);
    }),
  }),

  // ─── Profile ──────────────────────────────────────────────────────────────
  profile: router({
    getMe: protectedProcedure.query(async ({ ctx }) => {
      const { getUserByOpenId } = await import("./db");
      return getUserByOpenId(ctx.user.openId);
    }),
    update: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128).optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().max(32).optional(),
        timezone: z.string().max(64).optional(),
        language: z.string().max(8).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        notificationsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateUserProfile } = await import("./db");
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const { getUserProfileStats } = await import("./db");
      return getUserProfileStats(ctx.user.id);
    }),
  }),

  // ─── Alert Comments ──────────────────────────────────────────────────────────
  comments: router({
    // Get all comments for an alert
    getComments: protectedProcedure
      .input(z.object({
        alertType: z.enum(["crisis", "violence"]),
        alertId: z.number().int().positive(),
      }))
      .query(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "facilitator";
        if (!isSuperadmin && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        return getAlertComments(input.alertType, input.alertId);
      }),

    // Add a new comment
    addComment: protectedProcedure
      .input(z.object({
        alertType: z.enum(["crisis", "violence"]),
        alertId: z.number().int().positive(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const isSuperadmin = ctx.user.role === "superadmin";
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "facilitator";
        if (!isSuperadmin && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const id = await addAlertComment({
          alertType: input.alertType,
          alertId: input.alertId,
          authorId: ctx.user.id,
          content: input.content,
        });
        return { success: true, id };
      }),

    // Edit own comment
    editComment: protectedProcedure
      .input(z.object({
        commentId: z.number().int().positive(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        await editAlertComment(input.commentId, ctx.user.id, input.content);
        return { success: true };
      }),

    // Delete own comment (or admin can delete any)
    deleteComment: protectedProcedure
      .input(z.object({
        commentId: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        await deleteAlertComment(input.commentId, ctx.user.id);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
