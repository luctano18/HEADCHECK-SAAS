import { TRPCError } from "@trpc/server";
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
} from "./db";

// ─── Crisis Detection ─────────────────────────────────────────────────────────
const CRISIS_KEYWORDS_CRITICAL = [
  "kill myself", "suicide", "end my life", "want to die", "don't want to live",
  "hurt myself", "self-harm", "cutting myself", "overdose", "jump off",
];
const CRISIS_KEYWORDS_HIGH = [
  "hopeless", "worthless", "can't go on", "no reason to live", "disappear",
  "nobody cares", "better off dead", "give up on life", "can't take it anymore",
];
const CRISIS_KEYWORDS_MODERATE = [
  "depressed", "anxious", "overwhelmed", "can't cope", "breaking down",
  "falling apart", "losing control", "panic", "terrified",
];

export function detectCrisis(text: string, intensity: number): { detected: boolean; severity: "moderate" | "high" | "critical" | null } {
  const lower = text.toLowerCase();
  if (CRISIS_KEYWORDS_CRITICAL.some((k) => lower.includes(k))) return { detected: true, severity: "critical" };
  if (CRISIS_KEYWORDS_HIGH.some((k) => lower.includes(k)) || intensity >= 9) return { detected: true, severity: "high" };
  if (CRISIS_KEYWORDS_MODERATE.some((k) => lower.includes(k)) && intensity >= 7) return { detected: true, severity: "moderate" };
  return { detected: false, severity: null };
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

Generate a structured JSON response with EXACTLY these 6 fields:
1. "emotionalReflection": A warm, validating 2-3 sentence reflection on what the user is feeling.
2. "brainInsight": A 2-sentence neuroscience explanation of what's happening in the brain (mention specific brain regions like amygdala, prefrontal cortex, etc.).
3. "eiPillar": The most relevant EI pillar name (one of: Self-Awareness, Self-Regulation, Motivation, Empathy, Social Skills).
4. "eiPillarDescription": A 2-sentence explanation of how this EI pillar applies to their current state.
5. "aieiProverb": An authentic African proverb relevant to their situation (include origin country/culture).
6. "aieiProverbOrigin": The country or culture of origin for the proverb.
7. "personalizedNextStep": A specific, actionable 2-3 sentence recommendation for their next step.
8. "supportInvitation": A gentle 1-2 sentence invitation to seek additional support if needed.

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
          },
          required: ["emotionalReflection", "brainInsight", "eiPillar", "eiPillarDescription", "aieiProverb", "aieiProverbOrigin", "personalizedNextStep", "supportInvitation"],
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
  };
}

// ─── Seven Mirrors AI Summary ─────────────────────────────────────────────────
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
      if (!ctx.user.institutionId) return [];
      return getGroupsByInstitution(ctx.user.institutionId);
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
        if (!ctx.user.institutionId) throw new TRPCError({ code: "FORBIDDEN" });
        return getCohortCheckInTrends(ctx.user.institutionId, input.days ?? 30);
      }),
    getEngagement: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.institutionId) throw new TRPCError({ code: "FORBIDDEN" });
      return getCohortEngagement(ctx.user.institutionId);
    }),
    getCrisisAlerts: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.institutionId) throw new TRPCError({ code: "FORBIDDEN" });
      return getCrisisEventsByInstitution(ctx.user.institutionId);
    }),
  }),

  // ─── Coaching ─────────────────────────────────────────────────────────────────────────────────
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
});
export type AppRouter = typeof appRouter;
