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
  createNotification,
  getNotificationsForUser,
  getUnreadCountForUser,
  markNotificationRead,
  markAllNotificationsRead,
  getAdminUsers,
  markNotificationEmailSent,
  getRecentEmotionPatterns,
  updateAiResponseFeedback,
  upsertResourceRating,
  getResourceRatingStats,
  getBatchResourceRatingStats,
  createInterventionSession,
  getInterventionSessionByCheckIn,
  getRecentInterventionSessions,
  countYellowSessionsInWindow,
  countRecentNotYet,
  updateInterventionSessionEscalation,
  getInterventionConfig,
  upsertInterventionConfig,
  createPatternFlag,
  getUnshownPatternFlags,
  markPatternFlagsShown,
  getEmotionDistribution,
  getCheckInActivity,
  getWellnessLogbook,
  getPersonalizedRecommendations,
} from "./db";
import {
  runInterventionPipeline,
  detectPatterns,
  DEFAULT_THRESHOLDS,
  type CheckInInputs,
} from "./interventionEngine";
import { sendNotificationEmail } from "./notificationEmail";
import {
  EI_QUIZ_QUESTIONS,
  calculatePillarScores,
  getEILevel,
} from "../shared/eiQuizData";
import { getResourcesForEmotion } from "../shared/emotionResources";
import { getBrainInsightContext } from "../shared/brainEmotionMap";

// ─── Notification Helper ────────────────────────────────────────────────────
/**
 * Creates in-app notifications for all admin/superadmin users and sends emails
 * to those who have notificationsEnabled = true.
 */
async function notifyAdmins(params: {
  type: "crisis_alert" | "violence_flag" | "alert_assigned" | "new_comment" | "new_checkin";
  title: string;
  body: string;
  link?: string;
  institutionId?: number;
  excludeUserId?: number; // don't notify the actor themselves
}) {
  try {
    const admins = await getAdminUsers(params.institutionId);
    for (const admin of admins) {
      if (params.excludeUserId && admin.id === params.excludeUserId) continue;
      // Create in-app notification
      await createNotification({
        userId: admin.id,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      });
      // Send email if notifications are enabled
      if (admin.notificationsEnabled && admin.email) {
        const sent = await sendNotificationEmail({
          to: admin.email,
          type: params.type,
          title: params.title,
          body: params.body,
          link: params.link,
          recipientName: admin.name ?? undefined,
        });
        if (sent) await markNotificationEmailSent(0); // emailSent tracked per notification row
      }
    }

    // ── Web Push: fire-and-forget for all eligible admins ─────────────────────────────────────
    const pushTargetIds = admins
      .filter((a) => !params.excludeUserId || a.id !== params.excludeUserId)
      .map((a) => a.id);
    if (pushTargetIds.length > 0) {
      import("./webpush").then(({ sendPushToUsers }) =>
        sendPushToUsers(pushTargetIds, {
          title: params.title,
          body: params.body,
          url: params.link ?? "/",
          tag: params.type,
          requireInteraction: params.type === "crisis_alert" || params.type === "violence_flag",
        })
      ).catch((e) => console.warn("[WebPush] notifyAdmins push error:", e));
    }
  } catch (err) {
    console.error("[notifyAdmins] Failed to send notifications:", err);
  }
}

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
  patternContext?: string; // Recent emotion history for Pattern Insight
}) {
  const { emotion, intensity, context, journalEntry, patternContext } = params;
  const patternSection = patternContext
    ? `\nRecent emotional history: ${patternContext}\n`
    : "";
  const brainContext = getBrainInsightContext(emotion);
  const prompt = `You are HeadCheck AI, a compassionate emotional wellness assistant that integrates neuroscience, Emotional Intelligence (EI), and African-Inspired Emotional Intelligence (AIEI).

A user is experiencing: Emotion: "${emotion}" | Intensity: ${intensity}/10 | Context: ${context}
${journalEntry ? `Journal: "${journalEntry}"` : ""}${patternSection}
Generate a structured JSON response with EXACTLY these 11 fields:
1. "emotionalReflection": A warm, validating 2-3 sentence reflection on what the user is feeling. Use a compassionate, non-judgmental tone.
2. "brainInsight": A 2-sentence neuroscience explanation of what's happening in the brain. Use this brain-emotion mapping as your scientific reference: ${brainContext}. End with: "This is your brain trying to protect you, not a failure."
3. "eiPillar": The most relevant EI pillar name (one of: Self-Awareness, Self-Regulation, Motivation, Empathy, Social Skills).
4. "eiPillarDescription": A 2-sentence explanation of how this EI pillar applies to their current state and what growth looks like.
5. "aieiProverb": An authentic African proverb relevant to their situation.
6. "aieiProverbOrigin": The country or culture of origin for the proverb (e.g., "Yoruba, Nigeria" or "Swahili, East Africa").
7. "aieiProverbExplanation": A 1-2 sentence explanation of how this proverb applies to the user's current emotional state.
8. "personalizedNextStep": A specific, actionable 2-3 sentence recommendation for their immediate next step.
9. "supportInvitation": A gentle 1-2 sentence invitation to seek additional support if needed.
10. "affirmation": A short, powerful 1-sentence affirmation from your HeadCheck AI companion that the user can carry with them. Make it personal, warm, and rooted in their specific emotional state.
11. "patternInsight": ${patternContext ? `Based on the recent emotional history provided, give a 2-3 sentence compassionate insight about the emotional pattern you notice. Highlight what this pattern might mean and one gentle suggestion for breaking or nurturing it.` : `Return an empty string "".`}
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
            aieiProverbExplanation: { type: "string" },
            personalizedNextStep: { type: "string" },
            supportInvitation: { type: "string" },
            affirmation: { type: "string" },
            patternInsight: { type: "string" },
          },
          required: ["emotionalReflection", "brainInsight", "eiPillar", "eiPillarDescription", "aieiProverb", "aieiProverbOrigin", "aieiProverbExplanation", "personalizedNextStep", "supportInvitation", "affirmation", "patternInsight"],
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
    aieiProverbExplanation: string;
    personalizedNextStep: string;
    supportInvitation: string;
    affirmation: string;
    patternInsight: string;
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

  const prompt = `You are the HeadCheck AI companion — warm, insightful, and grounded in African wisdom.

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
        // ── Legacy fields (step 1 + slider) ──────────────────────────────────
        emotion: z.string().min(1),
        emotionEmoji: z.string().optional(),
        intensity: z.number().min(1).max(10),
        context: z.enum(["School", "Family", "Relationships", "Work", "Self"]),
        journalEntry: z.string().optional(),
        // ── EEIS structured inputs (steps 2-10) ──────────────────────────────
        contributors: z.array(z.string()).optional(),
        emotionalImpact: z.array(z.string()).optional(),
        intenseFeelings: z.array(z.string()).optional(),
        secondaryStressors: z.array(z.string()).optional(),
        supportPreference: z.string().optional(),
        possibleNextStep: z.string().optional(),
        supportSource: z.string().optional(),
        didHelp: z.enum(["yes_clearer", "somewhat_calmer", "not_yet"]).optional(),
        journalNotes: z.string().optional(),
        otherInputs: z.record(z.string(), z.string()).optional(),
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
          notifyAdmins({
            type: "crisis_alert",
            title: `⚠️ Crisis Alert Detected (${crisis.severity.toUpperCase()})`,
            body: `A ${crisis.severity} crisis signal was detected in a student check-in. Identities are anonymized.`,
            link: `/facilitator`,
            institutionId: ctx.user.institutionId ?? undefined,
            excludeUserId: undefined,
          }).catch(() => {});
        }

        // ── EEIS Pipeline ─────────────────────────────────────────────────────
        let interventionResult: Awaited<ReturnType<typeof runInterventionPipeline>> | null = null;
        let interventionSessionId: number | undefined;

        // Only run full pipeline when EEIS inputs are provided (step 2+)
        const hasEEISInputs = !!(input.contributors?.length || input.emotionalImpact?.length || input.intenseFeelings?.length);
        if (hasEEISInputs) {
          // Load institution config for thresholds
          const config = await getInterventionConfig(ctx.user.institutionId ?? undefined);
          const thresholds = config
            ? { greenMax: config.greenMaxScore, yellowMax: config.yellowMaxScore }
            : DEFAULT_THRESHOLDS;

          // Load escalation context
          const yellowRepeatDays = config?.yellowRepeatDays ?? 7;
          const yellowRepeatCount = config?.yellowRepeatCount ?? 3;
          const lowResolutionCount = config?.lowResolutionCount ?? 2;
          const [recentYellowCount, recentNotYetCount] = await Promise.all([
            countYellowSessionsInWindow(ctx.user.id, yellowRepeatDays),
            countRecentNotYet(ctx.user.id, lowResolutionCount),
          ]);

          const eeisInputs: CheckInInputs = {
            primaryEmotion: input.emotion,
            contributors: input.contributors ?? [],
            emotionalImpact: input.emotionalImpact ?? [],
            intenseFeelings: input.intenseFeelings ?? [],
            secondaryStressors: input.secondaryStressors ?? [],
            supportPreference: input.supportPreference,
            possibleNextStep: input.possibleNextStep,
            supportSource: input.supportSource,
            didHelp: input.didHelp,
            journalNotes: input.journalNotes ?? input.journalEntry,
            otherInputs: input.otherInputs as Record<string, string> | undefined,
            intensity: input.intensity,
            context: input.context,
          };

          interventionResult = await runInterventionPipeline(
            eeisInputs,
            {
              recentYellowCount,
              recentNotYetCount,
              thresholds: { yellowRepeatDays, yellowRepeatCount, lowResolutionCount },
            },
            thresholds
          );

          // Save intervention session
          interventionSessionId = await createInterventionSession({
            userId: ctx.user.id,
            checkInId,
            primaryEmotion: input.emotion,
            contributors: input.contributors ?? [],
            emotionalImpact: input.emotionalImpact ?? [],
            intenseFeelings: input.intenseFeelings ?? [],
            secondaryStressors: input.secondaryStressors ?? [],
            supportPreference: input.supportPreference,
            possibleNextStep: input.possibleNextStep,
            supportSource: input.supportSource,
            didHelp: input.didHelp,
            journalNotes: input.journalNotes ?? input.journalEntry,
            otherInputs: input.otherInputs as Record<string, string> | undefined,
            emotionalIntensityScore: interventionResult.scores.emotionalIntensityScore,
            stressLoadScore: interventionResult.scores.stressLoadScore,
            readinessScore: interventionResult.scores.readinessScore,
            totalScore: interventionResult.scores.totalScore,
            tier: interventionResult.classification.tier,
            riskOverride: interventionResult.risk.riskOverride,
            riskLevel: interventionResult.risk.riskLevel,
            riskReasons: interventionResult.risk.riskReasons,
            stabilizationMessage: interventionResult.stabilization.message,
            nextStep: interventionResult.redirection.nextStep,
            nextStepReason: interventionResult.redirection.nextStepReason,
            escalationTriggered: interventionResult.escalation.shouldEscalate,
            escalationReason: interventionResult.escalation.reason,
            facilitatorNotified: false,
          });

          // Notify facilitator if escalation triggered
          if (interventionResult.escalation.shouldEscalate) {
            notifyAdmins({
              type: "crisis_alert",
              title: `🟡 Escalation Alert — ${interventionResult.classification.label} Tier`,
              body: `A student has been flagged for support: ${interventionResult.escalation.reason ?? "repeated distress signals"}. Identities are anonymized.`,
              link: `/facilitator`,
              institutionId: ctx.user.institutionId ?? undefined,
            }).catch(() => {});
            if (interventionSessionId) {
              await updateInterventionSessionEscalation(interventionSessionId, {
                escalationTriggered: true,
                facilitatorNotified: true,
              });
            }
          }

          // Pattern detection (fire-and-forget)
          getRecentInterventionSessions(ctx.user.id, 5).then(async (sessions) => {
            const summaries = sessions.map(s => ({
              primaryEmotion: s.primaryEmotion,
              tier: s.tier,
              didHelp: s.didHelp ?? undefined,
              supportSource: s.supportSource ?? undefined,
              createdAt: s.createdAt,
            }));
            const patterns = detectPatterns(summaries);
            if (patterns.recurringEmotion) {
              await createPatternFlag({ userId: ctx.user.id, flagType: "recurring_emotion", flagValue: patterns.recurringEmotion });
            }
            if (patterns.hasEscalationPattern) {
              await createPatternFlag({ userId: ctx.user.id, flagType: "escalation_pattern" });
            }
            if (patterns.hasLowResolutionPattern) {
              await createPatternFlag({ userId: ctx.user.id, flagType: "low_resolution" });
            }
            if (patterns.hasSupportAvoidance) {
              await createPatternFlag({ userId: ctx.user.id, flagType: "support_avoidance" });
            }
            if (patterns.hasSupportSeeking) {
              await createPatternFlag({ userId: ctx.user.id, flagType: "support_seeking" });
            }
          }).catch(() => {});
        }

        // ── AI Response (existing flow) ───────────────────────────────────────
        const recentPatterns = await getRecentEmotionPatterns(ctx.user.id, 5);
        let patternContext: string | undefined;
        if (recentPatterns.length >= 2) {
          const emotionList = recentPatterns.map((p) => p.emotion).join(", ");
          patternContext = `Last ${recentPatterns.length} check-ins: ${emotionList}`;
        }

        // Skip AI response generation if risk_override (crisis screen takes over)
        let aiData = null;
        if (!interventionResult?.risk.riskOverride) {
          aiData = await generateAiResponse({
            emotion: input.emotion,
            intensity: input.intensity,
            context: input.context,
            journalEntry: input.journalEntry,
            patternContext,
          });
          await saveAiResponse({ checkInId, userId: ctx.user.id, ...aiData });
        }

        const streakData = await updateUserStreak(ctx.user.id);

        return {
          checkInId,
          crisisDetected: crisis.detected,
          severity: crisis.severity,
          streak: streakData,
          // EEIS results
          intervention: interventionResult ? {
            tier: interventionResult.classification.tier,
            tierLabel: interventionResult.classification.label,
            tierColor: interventionResult.classification.color,
            scores: interventionResult.scores,
            riskOverride: interventionResult.risk.riskOverride,
            riskLevel: interventionResult.risk.riskLevel,
            stabilization: interventionResult.stabilization,
            redirection: interventionResult.redirection,
            escalationTriggered: interventionResult.escalation.shouldEscalate,
            escalationReason: interventionResult.escalation.reason,
            interventionSessionId,
          } : null,
        };
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

    submitFeedback: protectedProcedure
      .input(z.object({
        checkInId: z.number(),
        rating: z.enum(["helpful", "not_helpful", "yes", "somewhat", "not_yet"]),
        feedbackText: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateAiResponseFeedback(
          input.checkInId,
          ctx.user.id,
          input.rating,
          input.feedbackText
        );
        return { success: true };
      }),

    getEmotionResources: publicProcedure
      .input(z.object({ emotion: z.string().min(1) }))
      .query(({ input }) => {
        return getResourcesForEmotion(input.emotion);
      }),
  }),

  // ─── Resource Ratings ───────────────────────────────────────────────────────
  resources: router({
    /** Rate a resource (1-5 stars). Upserts: calling again updates the existing rating. */
    rate: protectedProcedure
      .input(z.object({
        resourceId: z.string().min(1).max(64),
        rating: z.number().int().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertResourceRating(ctx.user.id, input.resourceId, input.rating);
        return { success: true };
      }),

    /** Get average rating + vote count for a single resource. */
    getRatingStats: publicProcedure
      .input(z.object({ resourceId: z.string().min(1).max(64) }))
      .query(async ({ ctx, input }) => {
        const userId = (ctx as { user?: { id: number } }).user?.id;
        return getResourceRatingStats(input.resourceId, userId);
      }),

    /** Batch: get rating stats for multiple resources at once. */
    getBatchRatingStats: publicProcedure
      .input(z.object({ resourceIds: z.array(z.string().min(1).max(64)).max(20) }))
      .query(async ({ ctx, input }) => {
        const userId = (ctx as { user?: { id: number } }).user?.id;
        return getBatchResourceRatingStats(input.resourceIds, userId);
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
    getEmotionDistribution: protectedProcedure
      .input(z.object({ days: z.union([z.literal(30), z.literal(90)]).default(30) }))
      .query(async ({ ctx, input }) => {
        return getEmotionDistribution(ctx.user.id, input.days);
      }),
    getCheckInActivity: protectedProcedure
      .input(z.object({ days: z.union([z.literal(30), z.literal(90)]).default(30) }))
      .query(async ({ ctx, input }) => {
        return getCheckInActivity(ctx.user.id, input.days);
      }),
    getWellnessLogbook: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(30), offset: z.number().min(0).default(0) }))
      .query(async ({ ctx, input }) => {
        return getWellnessLogbook(ctx.user.id, input.limit, input.offset);
      }),
    getPersonalizedRecommendations: protectedProcedure.query(async ({ ctx }) => {
      return getPersonalizedRecommendations(ctx.user.id);
    }),
    exportCheckIns: protectedProcedure
      .input(z.object({ days: z.union([z.literal(30), z.literal(90), z.literal(365)]).default(90) }))
      .query(async ({ ctx, input }) => {
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        const all = await getCheckInsByUser(ctx.user.id, 365);
        return all.filter((ci) => new Date(ci.createdAt) >= since).map((ci) => ({
          date: new Date(ci.createdAt).toISOString().slice(0, 10),
          time: new Date(ci.createdAt).toTimeString().slice(0, 5),
          emotion: ci.emotion,
          intensity: ci.intensity,
          context: ci.context,
          journalEntry: ci.journalEntry ?? "",
        }));
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
        // Notify admins of new safety/violence flag (fire-and-forget)
        notifyAdmins({
          type: "violence_flag",
          title: `🚨 Safety Flag Raised (${input.severity.toUpperCase()})`,
          body: `A ${input.severity} ${input.flagType.replace(/_/g, " ")} flag was raised. Identities are anonymized.`,
          link: `/facilitator`,
          institutionId: ctx.user.institutionId ?? undefined,
          excludeUserId: undefined,
        }).catch(() => {});
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
        // Notify the assignee (fire-and-forget)
        if (assignee.id !== ctx.user.id) {
          createNotification({
            userId: assignee.id,
            type: "alert_assigned",
            title: `📋 Alert Assigned to You`,
            body: `A ${input.alertType} alert has been assigned to you by ${ctx.user.name ?? ctx.user.email}.`,
            link: `/alert/${input.alertType}/${input.alertId}`,
          }).catch(() => {});
          if (assignee.notificationsEnabled && assignee.email) {
            sendNotificationEmail({
              to: assignee.email,
              type: "alert_assigned",
              title: `Alert Assigned to You`,
              body: `A ${input.alertType} alert has been assigned to you by ${ctx.user.name ?? ctx.user.email}.`,
              link: `/alert/${input.alertType}/${input.alertId}`,
              recipientName: assignee.name ?? undefined,
            }).catch(() => {});
          }
          // Web Push to assignee
          import("./webpush").then(({ sendPushToUsers }) =>
            sendPushToUsers([assignee.id], {
              title: "📋 Alert Assigned to You",
              body: `A ${input.alertType} alert has been assigned to you by ${ctx.user.name ?? ctx.user.email}.`,
              url: `/alert/${input.alertType}/${input.alertId}`,
              tag: "alert_assigned",
              requireInteraction: true,
            })
          ).catch(() => {});
        }
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
    /** Get current reminder settings for the logged-in user */
    getReminderSettings: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return null;
      const [user] = await db
        .select({
          reminderEnabled: users.reminderEnabled,
          reminderTime: users.reminderTime,
          reminderDays: users.reminderDays,
          weeklyReflectionEnabled: users.weeklyReflectionEnabled,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      return user ?? null;
    }),
    /** Update reminder settings for the logged-in user */
    updateReminderSettings: protectedProcedure
      .input(z.object({
        reminderEnabled: z.boolean(),
        reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
        reminderDays: z.string().regex(/^[0-6](,[0-6])*$/).optional(),
        weeklyReflectionEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(users)
          .set({
            reminderEnabled: input.reminderEnabled,
            ...(input.reminderTime !== undefined && { reminderTime: input.reminderTime }),
            ...(input.reminderDays !== undefined && { reminderDays: input.reminderDays }),
            ...(input.weeklyReflectionEnabled !== undefined && { weeklyReflectionEnabled: input.weeklyReflectionEnabled }),
          })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
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
        // Notify all admins about the new comment (fire-and-forget)
        notifyAdmins({
          type: "new_comment",
          title: `💬 New Comment on ${input.alertType === "crisis" ? "Crisis" : "Safety"} Alert`,
          body: `${ctx.user.name ?? ctx.user.email} added a comment to alert #${input.alertId}.`,
          link: `/alert/${input.alertType}/${input.alertId}`,
          institutionId: ctx.user.institutionId ?? undefined,
          excludeUserId: ctx.user.id,
        }).catch(() => {});
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
  // ─── Notifications ────────────────────────────────────────────────────────────
  notifications: router({
    // Get all notifications for the current user
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        return getNotificationsForUser(ctx.user.id);
      }),
    // Get unread count (for the bell badge)
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const count = await getUnreadCountForUser(ctx.user.id);
        return { count };
      }),
    // Mark a single notification as read
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),
    // Mark all notifications as read
    markAllRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await markAllNotificationsRead(ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Web Push Subscriptions ───────────────────────────────────────────────────
  push: router({
    // Register a push subscription for the current user
    subscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string().url(),
        p256dh: z.string().min(1),
        auth: z.string().min(1),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { savePushSubscription } = await import("./webpush");
        await savePushSubscription(
          ctx.user.id,
          { endpoint: input.endpoint, keys: { p256dh: input.p256dh, auth: input.auth } },
          input.userAgent
        );
        return { success: true };
      }),
    // Remove a push subscription
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const { deletePushSubscription } = await import("./webpush");
        await deletePushSubscription(input.endpoint);
        return { success: true };
      }),
  }),

  // ─── Secure Messaging ──────────────────────────────────────────────────────────
  messages: router({
    /** Get all conversations for the current user */
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const { getConversationsForUser } = await import('./db');
      const convs = await getConversationsForUser(ctx.user.id, ctx.user.role);
      // Enrich with participant names
      const { getUserById } = await import('./db');
      return Promise.all(convs.map(async (conv) => {
        const otherId = ctx.user.role === 'student' ? conv.facilitatorId : conv.studentId;
        const other = await getUserById(otherId);
        return { ...conv, otherName: other?.name ?? 'Unknown', otherRole: other?.role ?? 'user' };
      }));
    }),

    /** Get or create a conversation between facilitator and student */
    getOrCreateConversation: protectedProcedure
      .input(z.object({
        otherUserId: z.number().int().positive(),
        subject: z.string().max(256).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getOrCreateConversation } = await import('./db');
        const isFacilitator = ['facilitator', 'admin', 'superadmin'].includes(ctx.user.role);
        const facilitatorId = isFacilitator ? ctx.user.id : input.otherUserId;
        const studentId = isFacilitator ? input.otherUserId : ctx.user.id;
        return getOrCreateConversation(facilitatorId, studentId, input.subject);
      }),

    /** Get messages for a conversation */
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const { getMessagesForConversation, markConversationMessagesRead } = await import('./db');
        // Mark messages as read when fetched
        await markConversationMessagesRead(input.conversationId, ctx.user.id);
        return getMessagesForConversation(input.conversationId);
      }),

    /** Send a message */
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number().int().positive(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createMessage } = await import('./db');
        const msg = await createMessage(input.conversationId, ctx.user.id, input.content);
        return msg;
      }),

    /** Get unread message count for the current user */
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const { getUnreadMessageCount } = await import('./db');
      return getUnreadMessageCount(ctx.user.id, ctx.user.role);
    }),
  }),

  // ─── Admin ───────────────────────────────────────────────────────────────────────
  admin: router({
    /** Preview the weekly report HTML (admin only) */
    getWeeklyReportPreview: protectedProcedure
      .query(async ({ ctx }) => {
        if (!['admin', 'superadmin'].includes(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const institutionId = ctx.user.institutionId;
        if (!institutionId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No institution found' });
        const { getInstitutionById } = await import('./db');
        const institution = await getInstitutionById(institutionId);
        const { collectWeeklyReportData, buildReportHtml } = await import('./weeklyReport');
        const data = await collectWeeklyReportData(institutionId, institution?.name ?? 'Your Institution');
        const html = buildReportHtml(data);
        return { html, data };
      }),

    /** Generate PDF and send weekly report to all admins of the institution */
    sendWeeklyReport: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!['admin', 'superadmin'].includes(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const institutionId = ctx.user.institutionId;
        if (!institutionId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No institution found' });
        const { getInstitutionById, getAdminUsers } = await import('./db');
        const institution = await getInstitutionById(institutionId);
        const admins = await getAdminUsers(institutionId);
        const { collectWeeklyReportData, buildReportHtml, generateReportPdf, sendWeeklyReportEmail } = await import('./weeklyReport');
        const data = await collectWeeklyReportData(institutionId, institution?.name ?? 'Your Institution');
        const html = buildReportHtml(data);
        const pdfBuffer = await generateReportPdf(html);
        const pdfBase64 = pdfBuffer.toString('base64');
        let sent = 0;
        for (const admin of admins) {
          if (!admin.email) continue;
          const ok = await sendWeeklyReportEmail({
            to: admin.email,
            recipientName: admin.name ?? 'Admin',
            institutionName: institution?.name ?? 'Your Institution',
            weekStart: data.weekStart,
            weekEnd: data.weekEnd,
            pdfBase64,
          });
          if (ok) sent++;
        }
        return { success: true, sent, total: admins.filter(a => a.email).length };
      }),
  }),

  // ── EEIS: Intervention ────────────────────────────────────────────────────────────────────────────────
  intervention: router({
    /** Get the intervention session for a specific check-in */
    getByCheckIn: protectedProcedure
      .input(z.object({ checkInId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getInterventionSessionByCheckIn(input.checkInId);
        if (!session || session.userId !== ctx.user.id) return null;
        return session;
      }),

    /** Get recent intervention sessions for the current user */
    getMyRecent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getRecentInterventionSessions(ctx.user.id, input.limit ?? 10);
      }),

    /** Get unshown pattern flags for the current user */
    getPatternFlags: protectedProcedure
      .query(async ({ ctx }) => {
        const flags = await getUnshownPatternFlags(ctx.user.id);
        return flags;
      }),

    /** Mark pattern flags as shown */
    markPatternFlagsShown: protectedProcedure
      .mutation(async ({ ctx }) => {
        await markPatternFlagsShown(ctx.user.id);
        return { success: true };
      }),

    /** Update support selection after escalation prompt */
    updateSupportSelection: protectedProcedure
      .input(z.object({
        interventionSessionId: z.number(),
        supportSelection: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const session = await getInterventionSessionByCheckIn(0);
        await updateInterventionSessionEscalation(input.interventionSessionId, {
          escalationTriggered: true,
          supportPromptShown: true,
          supportSelection: input.supportSelection,
        });
        return { success: true };
      }),

    /** Admin: get intervention config for the institution */
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        if (!['admin', 'superadmin', 'facilitator'].includes(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const config = await getInterventionConfig(ctx.user.institutionId ?? undefined);
        return config ?? {
          greenMaxScore: 4,
          yellowMaxScore: 9,
          yellowRepeatDays: 7,
          yellowRepeatCount: 3,
          lowResolutionCount: 2,
        };
      }),

    /** Admin: update intervention thresholds */
    updateConfig: protectedProcedure
      .input(z.object({
        greenMaxScore: z.number().min(1).max(8),
        yellowMaxScore: z.number().min(2).max(11),
        yellowRepeatDays: z.number().min(1).max(30),
        yellowRepeatCount: z.number().min(1).max(10),
        lowResolutionCount: z.number().min(1).max(10),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!['admin', 'superadmin'].includes(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await upsertInterventionConfig(ctx.user.institutionId ?? null, input);
        return { success: true };
      }),

    /** Admin: get all escalation alerts for the institution */
    getEscalationAlerts: protectedProcedure
      .query(async ({ ctx }) => {
        if (!['admin', 'superadmin', 'facilitator'].includes(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const db = await import('./db').then(m => m.getDb());
        if (!db) return [];
        const { interventionSessions, users } = await import('../drizzle/schema');
        const { eq, desc, and } = await import('drizzle-orm');
        // Get escalated sessions for institution members
        const rows = await db
          .select({
            id: interventionSessions.id,
            userId: interventionSessions.userId,
            tier: interventionSessions.tier,
            escalationReason: interventionSessions.escalationReason,
            facilitatorNotified: interventionSessions.facilitatorNotified,
            createdAt: interventionSessions.createdAt,
            totalScore: interventionSessions.totalScore,
          })
          .from(interventionSessions)
          .innerJoin(users, eq(interventionSessions.userId, users.id))
          .where(
            and(
              eq(interventionSessions.escalationTriggered, true),
              ctx.user.institutionId ? eq(users.institutionId, ctx.user.institutionId) : undefined
            )
          )
          .orderBy(desc(interventionSessions.createdAt))
          .limit(50);
        return rows;
      }),
  }),
});
export type AppRouter = typeof appRouter;
