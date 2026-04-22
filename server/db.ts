import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertCheckIn,
  InsertUser,
  aiResponses,
  alertActions,
  checkIns,
  crisisEvents,
  groups,
  institutions,
  invitations,
  sevenMirrorsResponses,
  sevenMirrorsSessions,
  users,
  userStreaks,
  userAchievements,
  violenceFlags,
  alertComments,
  notifications,
  resourceRatings,
  conversations,
  messages,
  interventionSessions,
  interventionConfig,
  patternFlags,
  InsertInterventionSession,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  // Role assignment logic:
  // 1. Owner openId always gets superadmin (on insert only; not overwritten on update).
  // 2. Explicit role passed → set it on insert; but NEVER overwrite in the UPDATE clause
  //    to avoid downgrading a manually-elevated user (e.g., superadmin) on next login.
  // 3. No role passed + not owner → role stays as-is in DB (not included in updateSet).
  if (user.openId === ENV.ownerOpenId) {
    values.role = "superadmin";
    // Only set on insert (ON DUPLICATE KEY UPDATE does NOT include role for owner
    // because the owner is already superadmin and we don't want to touch it).
  } else if (user.role !== undefined) {
    values.role = user.role;
    // Do NOT add role to updateSet — this prevents downgrading an elevated role
    // (e.g., superadmin manually set via DB) when the user logs in again.
  }
  // role is intentionally excluded from updateSet for all non-owner users
  // so that manually-assigned elevated roles (superadmin, admin) are preserved.

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserOnboarding(userId: number, data: {
  role?: "student" | "facilitator" | "admin" | "superadmin";
  institutionId?: number;
  groupId?: number;
  onboardingCompleted?: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ─── Institutions ─────────────────────────────────────────────────────────────
export async function createInstitution(name: string, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(institutions).values({ name, adminId });
  return result[0];
}

export async function getInstitutionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(institutions).where(eq(institutions.id, id)).limit(1);
  return result[0];
}

export async function getInstitutionByAdminId(adminId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(institutions).where(eq(institutions.adminId, adminId)).limit(1);
  return result[0];
}

// ─── Groups ───────────────────────────────────────────────────────────────────
export async function createGroup(name: string, institutionId: number, facilitatorId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(groups).values({ name, institutionId, facilitatorId });
}

export async function getGroupsByInstitution(institutionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(groups).where(eq(groups.institutionId, institutionId));
}

// ─── Invitations ──────────────────────────────────────────────────────────────
export async function createInvitation(data: {
  token: string;
  email: string;
  institutionId: number;
  groupId?: number;
  invitedByUserId: number;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(invitations).values(data);
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  return result[0];
}

export async function acceptInvitation(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set({ accepted: true }).where(eq(invitations.token, token));
}

// ─── Check-Ins ────────────────────────────────────────────────────────────────
export async function createCheckIn(data: InsertCheckIn) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(checkIns).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  return insertId;
}

export async function getCheckInsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(desc(checkIns.createdAt))
    .limit(limit);
}

export async function getCheckInById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(checkIns).where(eq(checkIns.id, id)).limit(1);
  return result[0];
}

// ─── AI Responses ─────────────────────────────────────────────────────────────
export async function saveAiResponse(data: {
  checkInId: number;
  userId: number;
  emotionalReflection: string;
  brainInsight: string;
  eiPillar: string;
  eiPillarDescription: string;
  aieiProverb: string;
  aieiProverbOrigin?: string;
  personalizedNextStep: string;
  supportInvitation: string;
  affirmation?: string;
  patternInsight?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(aiResponses).values(data);
}

// Returns the last N emotions for a user (for Pattern Insight)
export async function getRecentEmotionPatterns(userId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ emotion: checkIns.emotion, createdAt: checkIns.createdAt })
    .from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(desc(checkIns.createdAt))
    .limit(limit);
  return rows;
}

export async function updateAiResponseFeedback(
  checkInId: number,
  userId: number,
  rating: "helpful" | "not_helpful",
  feedbackText?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(aiResponses)
    .set({ feedbackRating: rating, feedbackText: feedbackText ?? null })
    .where(and(eq(aiResponses.checkInId, checkInId), eq(aiResponses.userId, userId)));
}

export async function getAiResponseByCheckIn(checkInId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiResponses).where(eq(aiResponses.checkInId, checkInId)).limit(1);
  return result[0];
}

export async function getRecentAiResponses(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(aiResponses)
    .where(eq(aiResponses.userId, userId))
    .orderBy(desc(aiResponses.createdAt))
    .limit(limit);
}

// ─── Crisis Events ────────────────────────────────────────────────────────────
export async function createCrisisEvent(data: {
  userId: number;
  checkInId?: number;
  triggerText?: string;
  severity: "moderate" | "high" | "critical";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(crisisEvents).values(data);
}

export async function getCrisisEventsByInstitution(institutionId: number) {
  const db = await getDb();
  if (!db) return [];
  // Join through users table
  return db
    .select({
      id: crisisEvents.id,
      userId: crisisEvents.userId,
      severity: crisisEvents.severity,
      acknowledged: crisisEvents.acknowledged,
      createdAt: crisisEvents.createdAt,
    })
    .from(crisisEvents)
    .innerJoin(users, eq(crisisEvents.userId, users.id))
    .where(eq(users.institutionId, institutionId))
    .orderBy(desc(crisisEvents.createdAt))
    .limit(50);
}

// ─── Seven Mirrors ────────────────────────────────────────────────────────────
export async function createSevenMirrorsSession(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(sevenMirrorsSessions).values({ userId });
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  return insertId;
}

export async function getActiveSevenMirrorsSession(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sevenMirrorsSessions)
    .where(and(eq(sevenMirrorsSessions.userId, userId), eq(sevenMirrorsSessions.completed, false)))
    .orderBy(desc(sevenMirrorsSessions.createdAt))
    .limit(1);
  return result[0];
}

export async function getSevenMirrorsSessionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sevenMirrorsSessions).where(eq(sevenMirrorsSessions.id, id)).limit(1);
  return result[0];
}

export async function saveSevenMirrorsResponse(data: {
  sessionId: number;
  userId: number;
  mirrorIndex: number;
  mirrorTheme: string;
  response: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(sevenMirrorsResponses).values(data);
  await db
    .update(sevenMirrorsSessions)
    .set({ currentMirrorIndex: data.mirrorIndex + 1 })
    .where(eq(sevenMirrorsSessions.id, data.sessionId));
}

export async function completeSevenMirrorsSession(sessionId: number, aiSummary: string, badges: string[]) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(sevenMirrorsSessions)
    .set({ completed: true, aiSummary, badgesEarned: badges, completedAt: new Date() })
    .where(eq(sevenMirrorsSessions.id, sessionId));
}

export async function getSevenMirrorsResponsesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(sevenMirrorsResponses)
    .where(eq(sevenMirrorsResponses.sessionId, sessionId))
    .orderBy(sevenMirrorsResponses.mirrorIndex);
}

export async function getCompletedSevenMirrorsSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(sevenMirrorsSessions)
    .where(and(eq(sevenMirrorsSessions.userId, userId), eq(sevenMirrorsSessions.completed, true)))
    .orderBy(desc(sevenMirrorsSessions.createdAt))
    .limit(10);
}

// ─── Streaks & Achievements ──────────────────────────────────────────────────
export async function updateUserStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number; totalCheckIns: number; newAchievements: string[] }> {
  const db = await getDb();
  if (!db) return { currentStreak: 0, longestStreak: 0, totalCheckIns: 0, newAchievements: [] };

  const today = new Date().toISOString().split("T")[0]!; // YYYY-MM-DD
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;

  const existing = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);
  const streak = existing[0];

  let currentStreak = 1;
  let longestStreak = 1;
  let totalCheckIns = 1;

  if (streak) {
    totalCheckIns = streak.totalCheckIns + 1;
    if (streak.lastCheckInDate === today) {
      // Already checked in today — no streak change
      currentStreak = streak.currentStreak;
      longestStreak = streak.longestStreak;
    } else if (streak.lastCheckInDate === yesterday) {
      // Consecutive day
      currentStreak = streak.currentStreak + 1;
      longestStreak = Math.max(streak.longestStreak, currentStreak);
    } else {
      // Streak broken
      currentStreak = 1;
      longestStreak = streak.longestStreak;
    }
    await db.update(userStreaks).set({ currentStreak, longestStreak, totalCheckIns, lastCheckInDate: today }).where(eq(userStreaks.userId, userId));
  } else {
    await db.insert(userStreaks).values({ userId, currentStreak: 1, longestStreak: 1, totalCheckIns: 1, lastCheckInDate: today });
  }

  // Check for new achievements
  const newAchievements: string[] = [];
  const MILESTONES = [
    { key: "first_checkin", title: "First Step", emoji: "🌱", condition: totalCheckIns >= 1 },
    { key: "streak_3", title: "3-Day Streak", emoji: "🔥", condition: currentStreak >= 3 },
    { key: "streak_7", title: "Week Warrior", emoji: "⚡", condition: currentStreak >= 7 },
    { key: "streak_30", title: "Monthly Master", emoji: "🏆", condition: currentStreak >= 30 },
    { key: "checkins_10", title: "10 Check-Ins", emoji: "💪", condition: totalCheckIns >= 10 },
    { key: "checkins_50", title: "50 Check-Ins", emoji: "🌟", condition: totalCheckIns >= 50 },
  ];

  const existingAchievements = await db.select({ key: userAchievements.achievementKey }).from(userAchievements).where(eq(userAchievements.userId, userId));
  const earnedKeys = new Set(existingAchievements.map(a => a.key));

  for (const milestone of MILESTONES) {
    if (milestone.condition && !earnedKeys.has(milestone.key)) {
      await db.insert(userAchievements).values({
        userId,
        achievementKey: milestone.key,
        achievementTitle: milestone.title,
        achievementEmoji: milestone.emoji,
      });
      newAchievements.push(`${milestone.emoji} ${milestone.title}`);
    }
  }

  return { currentStreak, longestStreak, totalCheckIns, newAchievements };
}

export async function getUserStreak(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAchievements).where(eq(userAchievements.userId, userId)).orderBy(desc(userAchievements.earnedAt));
}

// ─── Facilitator Analytics ────────────────────────────────────────────────────
export async function getCohortCheckInTrends(institutionId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select({
      emotion: checkIns.emotion,
      context: checkIns.context,
      intensity: checkIns.intensity,
      createdAt: checkIns.createdAt,
    })
    .from(checkIns)
    .innerJoin(users, eq(checkIns.userId, users.id))
    .where(and(eq(users.institutionId, institutionId), gte(checkIns.createdAt, since)))
    .orderBy(desc(checkIns.createdAt))
    .limit(500);
}

export async function getCohortEngagement(institutionId: number) {
  const db = await getDb();
  if (!db) return { totalStudents: 0, activeStudents: 0, totalCheckIns: 0 };
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [totalStudentsResult, activeStudentsResult, totalCheckInsResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.institutionId, institutionId), eq(users.role, "student"))),
    db
      .select({ count: sql<number>`count(distinct ${checkIns.userId})` })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .where(and(eq(users.institutionId, institutionId), gte(checkIns.createdAt, since))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .where(eq(users.institutionId, institutionId)),
  ]);

  return {
    totalStudents: Number(totalStudentsResult[0]?.count ?? 0),
    activeStudents: Number(activeStudentsResult[0]?.count ?? 0),
    totalCheckIns: Number(totalCheckInsResult[0]?.count ?? 0),
  };
}

// ─── Global Analytics (superadmin — all institutions) ───────────────────────
export async function getAllCheckInTrends(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db
    .select({
      emotion: checkIns.emotion,
      context: checkIns.context,
      intensity: checkIns.intensity,
      createdAt: checkIns.createdAt,
    })
    .from(checkIns)
    .where(gte(checkIns.createdAt, since))
    .orderBy(desc(checkIns.createdAt))
    .limit(500);
}

export async function getAllEngagement() {
  const db = await getDb();
  if (!db) return { totalStudents: 0, activeStudents: 0, totalCheckIns: 0 };
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const [totalStudentsResult, activeStudentsResult, totalCheckInsResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "student")),
    db.select({ count: sql<number>`count(distinct ${checkIns.userId})` }).from(checkIns).where(gte(checkIns.createdAt, since)),
    db.select({ count: sql<number>`count(*)` }).from(checkIns),
  ]);
  return {
    totalStudents: Number(totalStudentsResult[0]?.count ?? 0),
    activeStudents: Number(activeStudentsResult[0]?.count ?? 0),
    totalCheckIns: Number(totalCheckInsResult[0]?.count ?? 0),
  };
}

export async function getAllCrisisEvents() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: crisisEvents.id,
      userId: crisisEvents.userId,
      severity: crisisEvents.severity,
      acknowledged: crisisEvents.acknowledged,
      createdAt: crisisEvents.createdAt,
    })
    .from(crisisEvents)
    .orderBy(desc(crisisEvents.createdAt))
    .limit(50);
}

export async function getAllViolenceFlags() {
  const db = await getDb();
  if (!db) return [];
  const { violenceFlags } = await import("../drizzle/schema");
  return db
    .select({
      id: violenceFlags.id,
      userId: violenceFlags.userId,
      flagType: violenceFlags.flagType,
      severity: violenceFlags.severity,
      acknowledged: violenceFlags.acknowledged,
      createdAt: violenceFlags.createdAt,
    })
    .from(violenceFlags)
    .orderBy(desc(violenceFlags.createdAt))
    .limit(50);
}

export async function getAllGroups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(groups).orderBy(desc(groups.id));
}

// ─── Coaching Sessions ────────────────────────────────────────────────────────
export async function createCoachingSession(data: {
  userId: number;
  sessionType: "30min" | "60min" | "3session" | "organization";
  questionnaire?: Record<string, string>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { coachingSessions } = await import("../drizzle/schema");
  const [result] = await db.insert(coachingSessions).values({
    userId: data.userId,
    sessionType: data.sessionType,
    questionnaire: data.questionnaire ?? null,
  });
  return { id: (result as { insertId?: number }).insertId ?? 0, ...data };
}

export async function getCoachingSessionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { coachingSessions } = await import("../drizzle/schema");
  return db.select().from(coachingSessions).where(eq(coachingSessions.userId, userId));
}

// ─── EI Quiz Attempts ─────────────────────────────────────────────────────────
export async function createQuizAttempt(data: {
  userId?: number;
  guestToken?: string;
  selfAwarenessScore: number;
  selfRegulationScore: number;
  motivationScore: number;
  empathyScore: number;
  socialSkillsScore: number;
  totalScore: number;
  level: "Emerging" | "Developing" | "Proficient" | "Advanced" | "Exceptional";
  answers: Record<string, number>;
  aiInsight?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { quizAttempts } = await import("../drizzle/schema");
  const [result] = await db.insert(quizAttempts).values({
    userId: data.userId ?? null,
    guestToken: data.guestToken ?? null,
    selfAwarenessScore: data.selfAwarenessScore,
    selfRegulationScore: data.selfRegulationScore,
    motivationScore: data.motivationScore,
    empathyScore: data.empathyScore,
    socialSkillsScore: data.socialSkillsScore,
    totalScore: data.totalScore,
    level: data.level,
    answers: data.answers,
    aiInsight: data.aiInsight ?? null,
  });
  return { id: (result as { insertId?: number }).insertId ?? 0, ...data };
}

export async function getQuizAttemptsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { quizAttempts } = await import("../drizzle/schema");
  return db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt))
    .limit(20);
}

export async function getLatestQuizAttempt(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const { quizAttempts } = await import("../drizzle/schema");
  const results = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt))
    .limit(1);
  return results[0] ?? null;
}

// ─── User Credentials (email/password) ───────────────────────────────────────
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return results[0] ?? null;
}

export async function createUserWithCredential(params: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  emailVerificationToken: string;
  emailVerificationExpiry: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { userCredentials } = await import("../drizzle/schema");
  // Create user
  await db.insert(users).values({
    openId: params.openId,
    name: params.name,
    email: params.email,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  const created = await getUserByEmail(params.email);
  if (!created) throw new Error("Failed to create user");
  // Create credential
  await db.insert(userCredentials).values({
    userId: created.id,
    passwordHash: params.passwordHash,
    emailVerified: false,
    emailVerificationToken: params.emailVerificationToken,
    emailVerificationExpiry: params.emailVerificationExpiry,
  });
  return created;
}

export async function getCredentialByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const { userCredentials } = await import("../drizzle/schema");
  const results = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.userId, userId))
    .limit(1);
  return results[0] ?? null;
}

export async function updatePasswordHash(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  const { userCredentials } = await import("../drizzle/schema");
  await db
    .update(userCredentials)
    .set({ passwordHash })
    .where(eq(userCredentials.userId, userId));
}

export async function verifyEmailToken(token: string) {
  const db = await getDb();
  if (!db) return false;
  const { userCredentials } = await import("../drizzle/schema");
  const results = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.emailVerificationToken, token))
    .limit(1);
  const cred = results[0];
  if (!cred) return false;
  if (cred.emailVerified) return true;
  if (cred.emailVerificationExpiry && cred.emailVerificationExpiry < new Date()) return false;
  await db
    .update(userCredentials)
    .set({ emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null })
    .where(eq(userCredentials.userId, cred.userId));
  return true;
}

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  const { passwordResetTokens } = await import("../drizzle/schema");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const { passwordResetTokens } = await import("../drizzle/schema");
  const results = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return results[0] ?? null;
}

export async function markPasswordResetTokenUsed(token: string) {
  const db = await getDb();
  if (!db) return;
  const { passwordResetTokens } = await import("../drizzle/schema");
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token));
}

// ─── Mood Trend Analytics ─────────────────────────────────────────────────────

/**
 * Returns daily aggregated mood data for the given user over the last `days` days.
 * Each row: date (YYYY-MM-DD), avgIntensity, checkInCount, dominantEmotion.
 */
export async function getMoodTrendByUser(userId: number, days: 30 | 90 = 30, emotion?: string) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const conditions = emotion
    ? and(eq(checkIns.userId, userId), gte(checkIns.createdAt, since), eq(checkIns.emotion, emotion))
    : and(eq(checkIns.userId, userId), gte(checkIns.createdAt, since));

  const rows = await db
    .select({
      intensity: checkIns.intensity,
      emotion: checkIns.emotion,
      createdAt: checkIns.createdAt,
    })
    .from(checkIns)
    .where(conditions)
    .orderBy(checkIns.createdAt);

  if (rows.length === 0) return [];

  // Aggregate by day in JS (avoids MySQL DATE_FORMAT dialect issues)
  const dayMap = new Map<string, { intensities: number[]; emotions: Record<string, number> }>();

  for (const row of rows) {
    const d = row.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap.has(key)) dayMap.set(key, { intensities: [], emotions: {} });
    const entry = dayMap.get(key)!;
    entry.intensities.push(row.intensity);
    entry.emotions[row.emotion] = (entry.emotions[row.emotion] ?? 0) + 1;
  }

  const result: { date: string; avgIntensity: number; checkInCount: number; dominantEmotion: string }[] = [];

  for (const [date, { intensities, emotions }] of Array.from(dayMap.entries())) {
    const avgIntensity =
      Math.round((intensities.reduce((s: number, v: number) => s + v, 0) / intensities.length) * 10) / 10;
    const dominantEmotion = (Object.entries(emotions) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
    result.push({ date, avgIntensity, checkInCount: intensities.length, dominantEmotion });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Returns summary statistics for the user's mood over the last `days` days.
 */
export async function getMoodStatsByUser(userId: number, days: 30 | 90 = 30, emotion?: string) {
  const db = await getDb();
  if (!db) return null;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const conditions = emotion
    ? and(eq(checkIns.userId, userId), gte(checkIns.createdAt, since), eq(checkIns.emotion, emotion))
    : and(eq(checkIns.userId, userId), gte(checkIns.createdAt, since));

  const rows = await db
    .select({ intensity: checkIns.intensity, emotion: checkIns.emotion })
    .from(checkIns)
    .where(conditions);

  if (rows.length === 0) return null;

  const intensities = rows.map((r) => r.intensity);
  const avg = Math.round((intensities.reduce((s: number, v: number) => s + v, 0) / intensities.length) * 10) / 10;
  const max = Math.max(...intensities);
  const min = Math.min(...intensities);

  const emotionCounts: Record<string, number> = {};
  for (const r of rows) {
    emotionCounts[r.emotion] = (emotionCounts[r.emotion] ?? 0) + 1;
  }
  const topEmotion = (Object.entries(emotionCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];

  // Trend: compare first half vs second half average
  const mid = Math.floor(intensities.length / 2);
  const firstHalfAvg = mid > 0 ? intensities.slice(0, mid).reduce((s: number, v: number) => s + v, 0) / mid : avg;
  const secondHalfLen = intensities.length - mid;
  const secondHalfAvg = secondHalfLen > 0 ? intensities.slice(mid).reduce((s: number, v: number) => s + v, 0) / secondHalfLen : avg;
  const trend: "up" | "down" | "stable" =
    secondHalfAvg - firstHalfAvg > 0.5 ? "up" : secondHalfAvg - firstHalfAvg < -0.5 ? "down" : "stable";

  return { totalCheckIns: rows.length, avgIntensity: avg, maxIntensity: max, minIntensity: min, topEmotion, trend };
}

/**
 * Returns the list of distinct emotions the user has logged in the last `days` days,
 * along with the count of check-ins per emotion (sorted by frequency descending).
 */
export async function getAvailableEmotions(userId: number, days: 30 | 90 = 30) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({ emotion: checkIns.emotion })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), gte(checkIns.createdAt, since)));

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.emotion] = (counts[r.emotion] ?? 0) + 1;
  }

  return (Object.entries(counts) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, count]) => ({ emotion, count }));
}

// ─── Violence Flags ───────────────────────────────────────────────────────────

export async function createViolenceFlag(data: {
  userId: number;
  checkInId?: number;
  triggerText?: string;
  flagType: "self_harm" | "violence_toward_others" | "crisis";
  severity: "moderate" | "high" | "critical";
}) {
  const db = await getDb();
  if (!db) return;
  const { violenceFlags } = await import("../drizzle/schema");
  await db.insert(violenceFlags).values(data);
}

export async function getViolenceFlagsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { violenceFlags } = await import("../drizzle/schema");
  return db
    .select()
    .from(violenceFlags)
    .where(eq(violenceFlags.userId, userId))
    .orderBy(desc(violenceFlags.createdAt))
    .limit(50);
}

export async function getViolenceFlagsByInstitution(institutionId: number) {
  const db = await getDb();
  if (!db) return [];
  const { violenceFlags } = await import("../drizzle/schema");
  return db
    .select({
      id: violenceFlags.id,
      userId: violenceFlags.userId,
      flagType: violenceFlags.flagType,
      severity: violenceFlags.severity,
      acknowledged: violenceFlags.acknowledged,
      createdAt: violenceFlags.createdAt,
    })
    .from(violenceFlags)
    .innerJoin(users, eq(violenceFlags.userId, users.id))
    .where(eq(users.institutionId, institutionId))
    .orderBy(desc(violenceFlags.createdAt))
    .limit(50);
}

export async function acknowledgeViolenceFlag(flagId: number) {
  const db = await getDb();
  if (!db) return;
  const { violenceFlags } = await import("../drizzle/schema");
  await db.update(violenceFlags).set({ acknowledged: true }).where(eq(violenceFlags.id, flagId));
}

// ─── Safety Plans ─────────────────────────────────────────────────────────────

export async function getSafetyPlanByUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const { safetyPlans } = await import("../drizzle/schema");
  const results = await db
    .select()
    .from(safetyPlans)
    .where(eq(safetyPlans.userId, userId))
    .limit(1);
  return results[0] ?? null;
}

export async function upsertSafetyPlan(data: {
  userId: number;
  trustedContacts?: Array<{ name: string; phone: string; relation: string }>;
  warningSignals?: string[];
  copingStrategies?: string[];
  safeEnvironments?: string[];
  professionalSupport?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { safetyPlans } = await import("../drizzle/schema");
  const existing = await getSafetyPlanByUser(data.userId);
  if (existing) {
    await db
      .update(safetyPlans)
      .set({
        trustedContacts: data.trustedContacts ?? existing.trustedContacts,
        warningSignals: data.warningSignals ?? existing.warningSignals,
        copingStrategies: data.copingStrategies ?? existing.copingStrategies,
        safeEnvironments: data.safeEnvironments ?? existing.safeEnvironments,
        professionalSupport: data.professionalSupport ?? existing.professionalSupport,
      })
      .where(eq(safetyPlans.userId, data.userId));
  } else {
    await db.insert(safetyPlans).values(data);
  }
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export async function updateUserProfile(userId: number, data: {
  name?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string;
  notificationsEnabled?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getUserProfileStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalCheckIns: 0, currentStreak: 0, longestStreak: 0, lastCheckInDate: null, achievements: [] };
  const achievements = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.earnedAt))
    .limit(10);
  const [streak] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);
  return {
    totalCheckIns: streak?.totalCheckIns ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastCheckInDate: streak?.lastCheckInDate ?? null,
    achievements,
  };
}

// ─── Crisis Event Resolution ───────────────────────────────────────────────────
export async function resolveCrisisEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(crisisEvents).set({ acknowledged: true }).where(eq(crisisEvents.id, eventId));
}

// ─── Group Member Counts ───────────────────────────────────────────────────────
export async function getGroupMemberCounts(institutionId: number): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db
    .select({ groupId: users.groupId, count: sql<number>`COUNT(*)` })
    .from(users)
    .where(and(eq(users.institutionId, institutionId), sql`${users.groupId} IS NOT NULL`))
    .groupBy(users.groupId);
  const map: Record<number, number> = {};
  for (const row of rows) {
    if (row.groupId != null) map[row.groupId] = Number(row.count);
  }
  return map;
}

// ─── Alert Detail Helpers ─────────────────────────────────────────────────────
export async function getCrisisEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: crisisEvents.id,
      userId: crisisEvents.userId,
      checkInId: crisisEvents.checkInId,
      triggerText: crisisEvents.triggerText,
      severity: crisisEvents.severity,
      acknowledged: crisisEvents.acknowledged,
      facilitatorNotified: crisisEvents.facilitatorNotified,
      assignedToId: crisisEvents.assignedToId,
      assignedAt: crisisEvents.assignedAt,
      createdAt: crisisEvents.createdAt,
    })
    .from(crisisEvents)
    .where(eq(crisisEvents.id, id))
    .limit(1);
  return result[0];
}

export async function getViolenceFlagById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: violenceFlags.id,
      userId: violenceFlags.userId,
      checkInId: violenceFlags.checkInId,
      triggerText: violenceFlags.triggerText,
      flagType: violenceFlags.flagType,
      severity: violenceFlags.severity,
      acknowledged: violenceFlags.acknowledged,
      facilitatorNotified: violenceFlags.facilitatorNotified,
      assignedToId: violenceFlags.assignedToId,
      assignedAt: violenceFlags.assignedAt,
      createdAt: violenceFlags.createdAt,
    })
    .from(violenceFlags)
    .where(eq(violenceFlags.id, id))
    .limit(1);
  return result[0];
}

export async function getAlertActions(alertType: "crisis" | "violence", alertId: number) {
  const db = await getDb();
  if (!db) return [];
  const condition =
    alertType === "crisis"
      ? eq(alertActions.crisisEventId, alertId)
      : eq(alertActions.violenceFlagId, alertId);
  const rows = await db
    .select({
      id: alertActions.id,
      adminUserId: alertActions.adminUserId,
      actionType: alertActions.actionType,
      note: alertActions.note,
      createdAt: alertActions.createdAt,
      adminName: users.name,
    })
    .from(alertActions)
    .leftJoin(users, eq(alertActions.adminUserId, users.id))
    .where(and(eq(alertActions.alertType, alertType), condition))
    .orderBy(desc(alertActions.createdAt));
  return rows;
}

export async function addAlertAction(data: {
  adminUserId: number;
  alertType: "crisis" | "violence";
  crisisEventId?: number;
  violenceFlagId?: number;
  actionType:
    | "acknowledged"
    | "contacted_student"
    | "escalated"
    | "referred_to_counselor"
    | "resolved"
    | "note_added"
    | "protocol_initiated"
    | "assigned";
  note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(alertActions).values(data);
  // If action is "resolved", mark the alert as acknowledged
  if (data.actionType === "resolved" || data.actionType === "acknowledged") {
    if (data.alertType === "crisis" && data.crisisEventId) {
      await db
        .update(crisisEvents)
        .set({ acknowledged: true })
        .where(eq(crisisEvents.id, data.crisisEventId));
    } else if (data.alertType === "violence" && data.violenceFlagId) {
      await db
        .update(violenceFlags)
        .set({ acknowledged: true })
        .where(eq(violenceFlags.id, data.violenceFlagId));
    }
  }
}

// ─── Alert Assignment Helpers ─────────────────────────────────────────────────

/** Assign a crisis alert to a team member */
export async function assignCrisisAlert(crisisEventId: number, assignedToId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(crisisEvents)
    .set({ assignedToId, assignedAt: new Date() })
    .where(eq(crisisEvents.id, crisisEventId));
}

/** Assign a violence flag to a team member */
export async function assignViolenceFlag(violenceFlagId: number, assignedToId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(violenceFlags)
    .set({ assignedToId, assignedAt: new Date() })
    .where(eq(violenceFlags.id, violenceFlagId));
}

/** Get all team members (admin, superadmin, facilitator) for an institution */
export async function getTeamMembers(institutionId: number | null) {
  const db = await getDb();
  if (!db) return [];
  if (institutionId) {
    return db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(
        and(
          eq(users.institutionId, institutionId),
          sql`${users.role} IN ('admin', 'superadmin', 'facilitator')`
        )
      );
  }
  // superadmin without institution — return all admins/superadmins/facilitators
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(sql`${users.role} IN ('admin', 'superadmin', 'facilitator')`);
}

/** Get crisis alerts assigned to a specific user */
export async function getMyCrisisAssignments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: crisisEvents.id,
      userId: crisisEvents.userId,
      severity: crisisEvents.severity,
      acknowledged: crisisEvents.acknowledged,
      assignedToId: crisisEvents.assignedToId,
      assignedAt: crisisEvents.assignedAt,
      createdAt: crisisEvents.createdAt,
    })
    .from(crisisEvents)
    .where(eq(crisisEvents.assignedToId, userId))
    .orderBy(desc(crisisEvents.createdAt));
}

/** Get violence flags assigned to a specific user */
export async function getMyViolenceAssignments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: violenceFlags.id,
      userId: violenceFlags.userId,
      flagType: violenceFlags.flagType,
      severity: violenceFlags.severity,
      acknowledged: violenceFlags.acknowledged,
      assignedToId: violenceFlags.assignedToId,
      assignedAt: violenceFlags.assignedAt,
      createdAt: violenceFlags.createdAt,
    })
    .from(violenceFlags)
    .where(eq(violenceFlags.assignedToId, userId))
    .orderBy(desc(violenceFlags.createdAt));
}

/** Get user by id (for assignee display) */
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, notificationsEnabled: users.notificationsEnabled })
    .from(users)
    .where(eq(users.id, userId));
  return rows[0] ?? null;
}

// ─── Alert Comments ────────────────────────────────────────────────────────────
export async function getAlertComments(alertType: "crisis" | "violence", alertId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: alertComments.id,
      alertType: alertComments.alertType,
      alertId: alertComments.alertId,
      authorId: alertComments.authorId,
      authorName: users.name,
      authorRole: users.role,
      content: alertComments.content,
      editedAt: alertComments.editedAt,
      createdAt: alertComments.createdAt,
    })
    .from(alertComments)
    .innerJoin(users, eq(alertComments.authorId, users.id))
    .where(and(eq(alertComments.alertType, alertType), eq(alertComments.alertId, alertId)))
    .orderBy(alertComments.createdAt);
}

export async function addAlertComment(data: {
  alertType: "crisis" | "violence";
  alertId: number;
  authorId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(alertComments).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  return insertId;
}

export async function deleteAlertComment(commentId: number, authorId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(alertComments)
    .where(and(eq(alertComments.id, commentId), eq(alertComments.authorId, authorId)));
}

export async function editAlertComment(commentId: number, authorId: number, content: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(alertComments)
    .set({ content, editedAt: new Date() })
    .where(and(eq(alertComments.id, commentId), eq(alertComments.authorId, authorId)));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(data: {
  userId: number;
  type: "crisis_alert" | "violence_flag" | "alert_assigned" | "new_comment" | "new_checkin";
  title: string;
  body: string;
  link?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ ...data, read: false, emailSent: false });
}

export async function getNotificationsForUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCountForUser(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return result[0]?.count ?? 0;
}

export async function markNotificationRead(notifId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notifId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function markNotificationEmailSent(notifId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ emailSent: true }).where(eq(notifications.id, notifId));
}

/** Returns all admin/superadmin users (optionally filtered by institutionId) */
export async function getAdminUsers(institutionId?: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, notificationsEnabled: users.notificationsEnabled })
    .from(users)
    .where(
      institutionId
        ? and(
            sql`${users.role} IN ('admin','superadmin','facilitator')`,
            eq(users.institutionId, institutionId)
          )
        : sql`${users.role} IN ('admin','superadmin')`
    );
  return rows;
}

// ─── Resource Ratings ─────────────────────────────────────────────────────────
/**
 * Upserts a star rating (1-5) for a given resource by a user.
 * If the user has already rated this resource, the existing rating is updated.
 */
export async function upsertResourceRating(userId: number, resourceId: string, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if rating already exists
  const existing = await db
    .select({ id: resourceRatings.id })
    .from(resourceRatings)
    .where(and(eq(resourceRatings.userId, userId), eq(resourceRatings.resourceId, resourceId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(resourceRatings)
      .set({ rating, updatedAt: new Date() })
      .where(and(eq(resourceRatings.userId, userId), eq(resourceRatings.resourceId, resourceId)));
  } else {
    await db.insert(resourceRatings).values({ userId, resourceId, rating });
  }
}

/**
 * Returns the average rating and total vote count for a resource.
 * Also returns the current user's rating if userId is provided.
 */
export async function getResourceRatingStats(resourceId: string, userId?: number) {
  const db = await getDb();
  if (!db) return { average: 0, count: 0, userRating: null as number | null };
  const rows = await db
    .select({ rating: resourceRatings.rating, userId: resourceRatings.userId })
    .from(resourceRatings)
    .where(eq(resourceRatings.resourceId, resourceId));
  const count = rows.length;
  const average = count > 0 ? rows.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const userRating = userId ? (rows.find((r) => r.userId === userId)?.rating ?? null) : null;
  return { average: Math.round(average * 10) / 10, count, userRating };
}

/**
 * Returns rating stats for multiple resources at once (batch).
 * Returns a map of resourceId → { average, count, userRating }.
 */
export async function getBatchResourceRatingStats(resourceIds: string[], userId?: number) {
  const db = await getDb();
  if (!db) return {} as Record<string, { average: number; count: number; userRating: number | null }>;
  if (resourceIds.length === 0) return {};
  const rows = await db
    .select({ rating: resourceRatings.rating, userId: resourceRatings.userId, resourceId: resourceRatings.resourceId })
    .from(resourceRatings)
    .where(sql`${resourceRatings.resourceId} IN (${sql.join(resourceIds.map((id) => sql`${id}`), sql`, `)})`);
  const result: Record<string, { average: number; count: number; userRating: number | null }> = {};
  for (const id of resourceIds) {
    const matching = rows.filter((r) => r.resourceId === id);
    const count = matching.length;
    const average = count > 0 ? matching.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    const userRating = userId ? (matching.find((r) => r.userId === userId)?.rating ?? null) : null;
    result[id] = { average: Math.round(average * 10) / 10, count, userRating };
  }
  return result;
}

// ─── Secure Messaging ─────────────────────────────────────────────────────────

export async function getOrCreateConversation(facilitatorId: number, studentId: number, subject?: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.facilitatorId, facilitatorId), eq(conversations.studentId, studentId)))
    .limit(1);
  if (existing.length > 0) return existing[0];
  const result = await db.insert(conversations).values({
    facilitatorId,
    studentId,
    subject: subject ?? null,
    lastMessageAt: new Date(),
    createdAt: new Date(),
  });
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  const [created] = await db.select().from(conversations).where(eq(conversations.id, insertId)).limit(1);
  return created;
}

export async function getConversationsForUser(userId: number, role: string) {
  const db = await getDb();
  if (!db) return [];
  const isFacilitator = ["facilitator", "admin", "superadmin"].includes(role);
  const condition = isFacilitator ? eq(conversations.facilitatorId, userId) : eq(conversations.studentId, userId);
  return db.select().from(conversations).where(condition).orderBy(desc(conversations.lastMessageAt));
}

export async function getMessagesForConversation(conversationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(limit);
}

export async function createMessage(conversationId: number, senderId: number, content: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(messages).values({ conversationId, senderId, content, read: false, createdAt: new Date() });
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
  const [msg] = await db.select().from(messages).where(eq(messages.id, insertId)).limit(1);
  return msg;
}

export async function markConversationMessagesRead(conversationId: number, readerId: number) {
  const db = await getDb();
  if (!db) return;
  // Mark messages in this conversation as read (only those NOT sent by the reader)
  const convMessages = await db.select().from(messages).where(and(eq(messages.conversationId, conversationId), eq(messages.read, false)));
  for (const msg of convMessages) {
    if (msg.senderId !== readerId) {
      await db.update(messages).set({ read: true }).where(eq(messages.id, msg.id));
    }
  }
}

export async function getUnreadMessageCount(userId: number, role: string) {
  const db = await getDb();
  if (!db) return 0;
  const isFacilitator = ["facilitator", "admin", "superadmin"].includes(role);
  const condition = isFacilitator ? eq(conversations.facilitatorId, userId) : eq(conversations.studentId, userId);
  const userConvs = await db.select({ id: conversations.id }).from(conversations).where(condition);
  if (userConvs.length === 0) return 0;
  let count = 0;
  for (const conv of userConvs) {
    const unread = await db
      .select()
      .from(messages)
      .where(and(eq(messages.conversationId, conv.id), eq(messages.read, false)));
    count += unread.filter((m) => m.senderId !== userId).length;
  }
  return count;
}

// ─── Intervention Sessions (EEIS) ─────────────────────────────────────────────
export async function createInterventionSession(data: InsertInterventionSession) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(interventionSessions).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  return insertId;
}

export async function getInterventionSessionByCheckIn(checkInId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(interventionSessions).where(eq(interventionSessions.checkInId, checkInId)).limit(1);
  return result[0];
}

export async function getRecentInterventionSessions(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(interventionSessions)
    .where(eq(interventionSessions.userId, userId))
    .orderBy(desc(interventionSessions.createdAt))
    .limit(limit);
}

export async function countYellowSessionsInWindow(userId: number, days: number) {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ id: interventionSessions.id })
    .from(interventionSessions)
    .where(and(
      eq(interventionSessions.userId, userId),
      eq(interventionSessions.tier, "yellow"),
      gte(interventionSessions.createdAt, since)
    ));
  return rows.length;
}

export async function countRecentNotYet(userId: number, limit = 3) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ didHelp: interventionSessions.didHelp })
    .from(interventionSessions)
    .where(eq(interventionSessions.userId, userId))
    .orderBy(desc(interventionSessions.createdAt))
    .limit(limit);
  return rows.filter(r => r.didHelp === "not_yet").length;
}

export async function updateInterventionSessionEscalation(id: number, data: {
  escalationTriggered: boolean;
  escalationReason?: string;
  facilitatorNotified?: boolean;
  supportPromptShown?: boolean;
  supportSelection?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(interventionSessions).set(data).where(eq(interventionSessions.id, id));
}

// ─── Intervention Config ──────────────────────────────────────────────────────
export async function getInterventionConfig(institutionId?: number) {
  const db = await getDb();
  if (!db) return null;
  // Try institution-specific config first, then global default
  if (institutionId) {
    const result = await db.select().from(interventionConfig).where(eq(interventionConfig.institutionId, institutionId)).limit(1);
    if (result[0]) return result[0];
  }
  const result = await db.select().from(interventionConfig).where(sql`institutionId IS NULL`).limit(1);
  return result[0] ?? null;
}

export async function upsertInterventionConfig(institutionId: number | null, data: {
  greenMaxScore?: number;
  yellowMaxScore?: number;
  yellowRepeatDays?: number;
  yellowRepeatCount?: number;
  lowResolutionCount?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = institutionId
    ? await db.select().from(interventionConfig).where(eq(interventionConfig.institutionId, institutionId)).limit(1)
    : await db.select().from(interventionConfig).where(sql`institutionId IS NULL`).limit(1);
  if (existing[0]) {
    await db.update(interventionConfig).set(data).where(eq(interventionConfig.id, existing[0].id));
  } else {
    await db.insert(interventionConfig).values({ institutionId: institutionId ?? undefined, ...data });
  }
}

// ─── Pattern Flags ────────────────────────────────────────────────────────────
export async function createPatternFlag(data: {
  userId: number;
  flagType: "recurring_emotion" | "escalation_pattern" | "low_resolution" | "support_avoidance" | "support_seeking";
  flagValue?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(patternFlags).values({ ...data, detectedAt: new Date(), shownToUser: false });
}

export async function getUnshownPatternFlags(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(patternFlags).where(and(eq(patternFlags.userId, userId), eq(patternFlags.shownToUser, false))).orderBy(desc(patternFlags.detectedAt)).limit(3);
}

export async function markPatternFlagsShown(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(patternFlags).set({ shownToUser: true }).where(eq(patternFlags.userId, userId));
}
