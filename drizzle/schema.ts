import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["student", "facilitator", "admin", "superadmin"]).default("student").notNull(),
  institutionId: int("institutionId"),
  groupId: int("groupId"),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  // Extended profile fields
  bio: text("bio"),
  phone: varchar("phone", { length: 32 }),
  timezone: varchar("timezone", { length: 64 }),
  language: varchar("language", { length: 8 }).default("en"),
  avatarUrl: text("avatarUrl"),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  // Smart reminder fields
  reminderEnabled: boolean("reminderEnabled").default(false).notNull(),
  reminderTime: varchar("reminderTime", { length: 5 }).default("08:00"), // HH:MM format
  reminderDays: varchar("reminderDays", { length: 32 }).default("1,2,3,4,5"), // comma-separated 0-6 (0=Sun)
  // Weekly reflection summary (opt-in email every Monday)
  weeklyReflectionEnabled: boolean("weeklyReflectionEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── User Credentials (email/password auth) ─────────────────────────────────────────────
export const userCredentials = mysqlTable("user_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 128 }),
  emailVerificationExpiry: timestamp("emailVerificationExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserCredential = typeof userCredentials.$inferSelect;

// ─── Password Reset Tokens ──────────────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// ─── Institutions (Schools) ───────────────────────────────────────────────────
export const institutions = mysqlTable("institutions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  adminId: int("adminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Institution = typeof institutions.$inferSelect;

// ─── Groups (Cohorts within an Institution) ───────────────────────────────────
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  institutionId: int("institutionId").notNull(),
  facilitatorId: int("facilitatorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Group = typeof groups.$inferSelect;

// ─── Invitations ──────────────────────────────────────────────────────────────
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  institutionId: int("institutionId").notNull(),
  groupId: int("groupId"),
  invitedByUserId: int("invitedByUserId").notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;

// ─── Emotional Check-Ins ──────────────────────────────────────────────────────
export const checkIns = mysqlTable("check_ins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emotion: varchar("emotion", { length: 64 }).notNull(),
  emotionEmoji: varchar("emotionEmoji", { length: 8 }),
  intensity: int("intensity").notNull(), // 1-10
  context: mysqlEnum("context", ["School", "Family", "Relationships", "Work", "Self"]).notNull(),
  journalEntry: text("journalEntry"),
  crisisDetected: boolean("crisisDetected").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

// ─── AI Responses ─────────────────────────────────────────────────────────────
export const aiResponses = mysqlTable("ai_responses", {
  id: int("id").autoincrement().primaryKey(),
  checkInId: int("checkInId").notNull().unique(),
  userId: int("userId").notNull(),
  emotionalReflection: text("emotionalReflection").notNull(),
  brainInsight: text("brainInsight").notNull(),
  eiPillar: varchar("eiPillar", { length: 128 }).notNull(),
  eiPillarDescription: text("eiPillarDescription").notNull(),
  aieiProverb: text("aieiProverb").notNull(),
  aieiProverbOrigin: varchar("aieiProverbOrigin", { length: 128 }),
  aieiProverbExplanation: text("aieiProverbExplanation"),
  personalizedNextStep: text("personalizedNextStep").notNull(),
  supportInvitation: text("supportInvitation").notNull(),
  affirmation: text("mochaAffirmation"),
  patternInsight: text("patternInsight"),
  feedbackRating: mysqlEnum("feedbackRating", ["helpful", "not_helpful", "yes", "somewhat", "not_yet"]),
  feedbackText: text("feedbackText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiResponse = typeof aiResponses.$inferSelect;

// ─── Crisis Events ────────────────────────────────────────────────────────────
export const crisisEvents = mysqlTable("crisis_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  checkInId: int("checkInId"),
  triggerText: text("triggerText"),
  severity: mysqlEnum("severity", ["moderate", "high", "critical"]).notNull(),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  facilitatorNotified: boolean("facilitatorNotified").default(false).notNull(),
  assignedToId: int("assignedToId"),
  assignedAt: timestamp("assignedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrisisEvent = typeof crisisEvents.$inferSelect;

// ─── Seven Mirrors Sessions ───────────────────────────────────────────────────
export const sevenMirrorsSessions = mysqlTable("seven_mirrors_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentMirrorIndex: int("currentMirrorIndex").default(0).notNull(), // 0-6
  completed: boolean("completed").default(false).notNull(),
  aiSummary: text("aiSummary"),
  badgesEarned: json("badgesEarned").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type SevenMirrorsSession = typeof sevenMirrorsSessions.$inferSelect;

// ─── Seven Mirrors Responses ──────────────────────────────────────────────────
export const sevenMirrorsResponses = mysqlTable("seven_mirrors_responses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  mirrorIndex: int("mirrorIndex").notNull(), // 0-6
  mirrorTheme: varchar("mirrorTheme", { length: 64 }).notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SevenMirrorsResponse = typeof sevenMirrorsResponses.$inferSelect;

// ─── User Streaks ─────────────────────────────────────────────────────────────
export const userStreaks = mysqlTable("user_streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastCheckInDate: varchar("lastCheckInDate", { length: 10 }), // YYYY-MM-DD
  totalCheckIns: int("totalCheckIns").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStreak = typeof userStreaks.$inferSelect;

// ─── User Achievements ────────────────────────────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementKey: varchar("achievementKey", { length: 64 }).notNull(),
  achievementTitle: varchar("achievementTitle", { length: 128 }).notNull(),
  achievementEmoji: varchar("achievementEmoji", { length: 8 }).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;

// ─── Coaching Sessions ────────────────────────────────────────────────────────
export const coachingSessions = mysqlTable("coaching_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionType: mysqlEnum("sessionType", ["30min", "60min", "3session", "organization"]).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  zoomLink: text("zoomLink"),
  notes: text("notes"),
  questionnaire: json("questionnaire").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = typeof coachingSessions.$inferInsert;

// ─── Business Registrations ───────────────────────────────────────────────────
export const businessRegistrations = mysqlTable("business_registrations", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  teamSize: mysqlEnum("teamSize", ["1-10", "11-50", "51-200", "201-500", "500+"]).notNull(),
  industry: varchar("industry", { length: 128 }),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }),
  wellnessGoals: text("wellnessGoals").notNull(),
  status: mysqlEnum("status", ["pending", "validated", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  institutionId: int("institutionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  validatedAt: timestamp("validatedAt"),
});

export type BusinessRegistration = typeof businessRegistrations.$inferSelect;
export type InsertBusinessRegistration = typeof businessRegistrations.$inferInsert;

// ─── Pulse Surveys ────────────────────────────────────────────────────────────
export const pulseSurveys = mysqlTable("pulse_surveys", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  question: text("question").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PulseSurvey = typeof pulseSurveys.$inferSelect;

export const pulseSurveyResponses = mysqlTable("pulse_survey_responses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PulseSurveyResponse = typeof pulseSurveyResponses.$inferSelect;

// ─── Wellness Resources (Institution-curated) ─────────────────────────────────
export const wellnessResources = mysqlTable("wellness_resources", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId"), // null = global resource
  addedByUserId: int("addedByUserId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url"),
  resourceType: mysqlEnum("resourceType", ["article", "video", "book", "exercise", "tool", "podcast"]).notNull(),
  eiPillar: mysqlEnum("eiPillar", ["Self-Awareness", "Self-Regulation", "Motivation", "Empathy", "Social Skills", "All"]).default("All").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WellnessResource = typeof wellnessResources.$inferSelect;
export type InsertWellnessResource = typeof wellnessResources.$inferInsert;

// ─── Violence Flags ──────────────────────────────────────────────────────────
export const violenceFlags = mysqlTable("violence_flags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  checkInId: int("checkInId"),
  triggerText: text("triggerText"),
  flagType: mysqlEnum("flagType", ["self_harm", "violence_toward_others", "crisis"]).notNull(),
  severity: mysqlEnum("severity", ["moderate", "high", "critical"]).notNull(),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  facilitatorNotified: boolean("facilitatorNotified").default(false).notNull(),
  assignedToId: int("assignedToId"),
  assignedAt: timestamp("assignedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ViolenceFlag = typeof violenceFlags.$inferSelect;
export type InsertViolenceFlag = typeof violenceFlags.$inferInsert;

// ─── Safety Plans ─────────────────────────────────────────────────────────────
export const safetyPlans = mysqlTable("safety_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  trustedContacts: json("trustedContacts").$type<Array<{ name: string; phone: string; relation: string }>>(),
  warningSignals: json("warningSignals").$type<string[]>(),
  copingStrategies: json("copingStrategies").$type<string[]>(),
  safeEnvironments: json("safeEnvironments").$type<string[]>(),
  professionalSupport: text("professionalSupport"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SafetyPlan = typeof safetyPlans.$inferSelect;
export type InsertSafetyPlan = typeof safetyPlans.$inferInsert;

// ─── Alert Actions (Admin history log) ───────────────────────────────────
export const alertActions = mysqlTable("alert_actions", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  alertType: mysqlEnum("alertType", ["crisis", "violence"]).notNull(),
  crisisEventId: int("crisisEventId"),
  violenceFlagId: int("violenceFlagId"),
  actionType: mysqlEnum("actionType", [
    "acknowledged",
    "contacted_student",
    "escalated",
    "referred_to_counselor",
    "resolved",
    "note_added",
    "protocol_initiated",
    "assigned"
  ]).notNull(),
  assignedToId: int("assignedToId"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AlertAction = typeof alertActions.$inferSelect;
export type InsertAlertAction = typeof alertActions.$inferInsert;

// ─── EI Quiz Attempts ─────────────────────────────────────────────────────────
export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for guest attempts
  guestToken: varchar("guestToken", { length: 64 }), // client-side ID for guests
  // Pillar scores (0-100 each)
  selfAwarenessScore: int("selfAwarenessScore").notNull(),
  selfRegulationScore: int("selfRegulationScore").notNull(),
  motivationScore: int("motivationScore").notNull(),
  empathyScore: int("empathyScore").notNull(),
  socialSkillsScore: int("socialSkillsScore").notNull(),
  totalScore: int("totalScore").notNull(), // 0-100
  level: mysqlEnum("level", ["Emerging", "Developing", "Proficient", "Advanced", "Exceptional"]).notNull(),
  answers: json("answers").$type<Record<string, number>>().notNull(), // questionId -> answer value
  aiInsight: text("aiInsight"), // AI-generated personalized feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

// ─── Alert Comments (Team Discussion) ────────────────────────────────────────
export const alertComments = mysqlTable("alert_comments", {
  id: int("id").autoincrement().primaryKey(),
  alertType: mysqlEnum("alertType", ["crisis", "violence"]).notNull(),
  alertId: int("alertId").notNull(), // crisisEventId or violenceFlagId
  authorId: int("authorId").notNull(), // userId of the commenter
  content: text("content").notNull(),
  editedAt: timestamp("editedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AlertComment = typeof alertComments.$inferSelect;
export type InsertAlertComment = typeof alertComments.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // recipient (admin/superadmin)
  type: mysqlEnum("notif_type", [
    "crisis_alert",
    "violence_flag",
    "alert_assigned",
    "new_comment",
    "new_checkin",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  link: varchar("link", { length: 512 }),
  read: boolean("read").default(false).notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Push Subscriptions ───────────────────────────────────────────────────────
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ─── Resource Ratings ─────────────────────────────────────────────────────────
export const resourceRatings = mysqlTable("resource_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resourceId: varchar("resourceId", { length: 64 }).notNull(), // e.g. "ow-1", "ax-2"
  rating: int("rating").notNull(), // 1-5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ResourceRating = typeof resourceRatings.$inferSelect;
export type InsertResourceRating = typeof resourceRatings.$inferInsert;

// ─── Secure Messaging ─────────────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  facilitatorId: int("facilitatorId").notNull(),
  studentId: int("studentId").notNull(),
  subject: varchar("subject", { length: 256 }),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Intervention Sessions (EEIS) ─────────────────────────────────────────────
export const interventionSessions = mysqlTable("intervention_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  checkInId: int("checkInId").notNull().unique(),
  primaryEmotion: varchar("primaryEmotion", { length: 64 }).notNull(),
  contributors: json("contributors").$type<string[]>().notNull(),
  emotionalImpact: json("emotionalImpact").$type<string[]>().notNull(),
  intenseFeelings: json("intenseFeelings").$type<string[]>().notNull(),
  secondaryStressors: json("secondaryStressors").$type<string[]>().notNull(),
  supportPreference: varchar("supportPreference", { length: 128 }),
  possibleNextStep: varchar("possibleNextStep", { length: 128 }),
  supportSource: varchar("supportSource", { length: 128 }),
  didHelp: mysqlEnum("didHelp", ["yes_clearer", "somewhat_calmer", "not_yet"]),
  otherInputs: json("otherInputs").$type<Record<string, string>>(),
  journalNotes: text("journalNotes"),
  emotionalIntensityScore: int("emotionalIntensityScore").notNull().default(0),
  stressLoadScore: int("stressLoadScore").notNull().default(0),
  readinessScore: int("readinessScore").notNull().default(0),
  totalScore: int("totalScore").notNull().default(0),
  tier: mysqlEnum("tier", ["green", "yellow", "red"]).notNull().default("green"),
  riskOverride: boolean("riskOverride").default(false).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["none", "crisis"]).default("none").notNull(),
  riskReasons: json("riskReasons").$type<string[]>(),
  stabilizationMessage: text("stabilizationMessage"),
  nextStep: varchar("nextStep", { length: 256 }),
  nextStepReason: text("nextStepReason"),
  escalationTriggered: boolean("escalationTriggered").default(false).notNull(),
  escalationReason: varchar("escalationReason", { length: 256 }),
  supportPromptShown: boolean("supportPromptShown").default(false).notNull(),
  supportSelection: varchar("supportSelection", { length: 128 }),
  facilitatorNotified: boolean("facilitatorNotified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InterventionSession = typeof interventionSessions.$inferSelect;
export type InsertInterventionSession = typeof interventionSessions.$inferInsert;

// ─── Intervention Config (configurable thresholds per institution) ─────────────
export const interventionConfig = mysqlTable("intervention_config", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId"),
  greenMaxScore: int("greenMaxScore").notNull().default(4),
  yellowMaxScore: int("yellowMaxScore").notNull().default(9),
  yellowRepeatDays: int("yellowRepeatDays").notNull().default(7),
  yellowRepeatCount: int("yellowRepeatCount").notNull().default(3),
  lowResolutionCount: int("lowResolutionCount").notNull().default(2),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InterventionConfig = typeof interventionConfig.$inferSelect;
export type InsertInterventionConfig = typeof interventionConfig.$inferInsert;

// ─── Pattern Flags ────────────────────────────────────────────────────────────
export const patternFlags = mysqlTable("pattern_flags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flagType: mysqlEnum("flagType", [
    "recurring_emotion",
    "escalation_pattern",
    "low_resolution",
    "support_avoidance",
    "support_seeking",
  ]).notNull(),
  flagValue: varchar("flagValue", { length: 128 }),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  shownToUser: boolean("shownToUser").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PatternFlag = typeof patternFlags.$inferSelect;
export type InsertPatternFlag = typeof patternFlags.$inferInsert;
