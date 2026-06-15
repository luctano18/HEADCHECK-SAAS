/**
 * weeklyReflection.ts
 * Sends personalized weekly reflection summary emails to users who have
 * completed at least 1 check-in in the past 7 days and have weeklyReflectionEnabled = true.
 *
 * Called via GET /api/cron/weekly-reflection (triggered every Monday at 9:00 AM UTC).
 * Secured by a shared CRON_SECRET header.
 */

import { getDb } from "./db";
import { users, checkIns, aiResponses } from "../drizzle/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "HeadCheck AI <notifications@headcheck.app>";
const CRON_SECRET = process.env.CRON_SECRET || "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklyUser {
  id: number;
  name: string | null;
  email: string | null;
  weeklyReflectionEnabled: boolean;
}

interface WeeklyCheckIn {
  emotion: string;
  intensity: number;
  journalEntry: string | null;
  createdAt: Date;
  aieiProverb: string | null;
  affirmation: string | null;
  patternInsight: string | null;
}

// ─── AI Summary Generator ─────────────────────────────────────────────────────

async function generateWeeklySummary(
  userName: string,
  checkInData: WeeklyCheckIn[]
): Promise<string> {
  const emotionList = checkInData.map(
    (c) => `${c.emotion} (intensity ${c.intensity}/10) on ${new Date(c.createdAt).toLocaleDateString("en-US", { weekday: "long" })}`
  ).join("\n");

  const proverbs = checkInData
    .map((c) => c.aieiProverb)
    .filter((p): p is string => Boolean(p))
    .slice(0, 2)
    .join(" | ");

  const affirmations = checkInData
    .map((c) => c.affirmation)
    .filter((a): a is string => Boolean(a))
    .slice(0, 2)
    .join(" | ");

  try {
    const systemMsg = `You are HeadCheck AI, a compassionate emotional intelligence companion. Write a warm, personalized weekly reflection summary for a user. Keep it to 3-4 short paragraphs. Use "you" language. Be encouraging, not clinical. Structure: 1) What your week showed emotionally, 2) A pattern or strength noticed, 3) One gentle invitation for the week ahead. End with the most resonant proverb from their week if available.`;
    const userMsg = `User: ${userName || "there"}\nCheck-ins this week (${checkInData.length} total):\n${emotionList}\n\nProverbs received: ${proverbs || "none"}\nAffirmations received: ${affirmations || "none"}\n\nWrite their weekly reflection summary.`;
    const response = await invokeLLM({
      messages: [
        { role: "system" as const, content: systemMsg },
        { role: "user" as const, content: userMsg },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : null;
    return text || generateFallbackSummary(userName, checkInData);
  } catch {
    return generateFallbackSummary(userName, checkInData);
  }
}

function generateFallbackSummary(userName: string, checkInData: WeeklyCheckIn[]): string {
  const name = userName || "there";
  const count = checkInData.length;
  const uniqueEmotions = Array.from(new Set(checkInData.map((c) => c.emotion)));
  const emotions = uniqueEmotions.join(", ");
  const avgIntensity = Math.round(
    checkInData.reduce((sum, c) => sum + c.intensity, 0) / count
  );

  return `Hi ${name},

You showed up ${count} time${count > 1 ? "s" : ""} this week — and that matters. Your check-ins reflected: ${emotions}.

Your average emotional intensity was ${avgIntensity}/10. Whether your week felt heavy or light, you chose to pause and check in with yourself. That is the practice.

For this coming week, consider one small act of self-compassion. You do not need to solve everything — just notice, name, and take the next step.

The HeadCheck AI Team`;
}

// ─── Email Sender ─────────────────────────────────────────────────────────────

async function sendWeeklyReflectionEmail(
  user: WeeklyUser,
  summary: string,
  checkInCount: number,
  appUrl: string
): Promise<boolean> {
  if (!RESEND_API_KEY || !user.email) return false;

  const name = user.name ?? "there";
  const unsubscribeUrl = `${appUrl}/profile?tab=notifications`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Reflection — HeadCheck AI</title>
</head>
<body style="margin:0;padding:0;background:#f8f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">🧠✨</div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">Your Weekly Reflection</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">
        ${checkInCount} check-in${checkInCount > 1 ? "s" : ""} this week · HeadCheck AI
      </p>
    </div>

    <!-- Summary Card -->
    <div style="background:#fff;border-radius:16px;padding:28px;margin-bottom:20px;box-shadow:0 2px 12px rgba(79,70,229,0.08);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:20px;">💜</span>
        <h2 style="font-size:16px;font-weight:700;color:#1e1b4b;margin:0;">Hi ${name},</h2>
      </div>
      <div style="font-size:15px;line-height:1.7;color:#374151;white-space:pre-line;">${summary}</div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${appUrl}/check-in" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
        Start This Week's Check-In →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:12px;color:#9ca3af;">
      <p style="margin:0 0 8px;">HeadCheck AI · A Real Time Emotional Response System</p>
      <p style="margin:0;">
        <a href="${unsubscribeUrl}" style="color:#6366f1;text-decoration:none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Your weekly reflection is ready, ${name} 🧠`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function sendWeeklyReflections(
  appUrl: string,
  secret?: string
): Promise<{ sent: number; skipped: number; errors: number }> {
  // Validate secret if configured
  if (CRON_SECRET && secret !== CRON_SECRET) {
    throw new Error("Unauthorized");
  }

  const db = await getDb();
  if (!db) return { sent: 0, skipped: 0, errors: 0 };
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all users with weeklyReflectionEnabled = true and an email
  const eligibleUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      weeklyReflectionEnabled: users.weeklyReflectionEnabled,
    })
    .from(users)
    .where(and(eq(users.weeklyReflectionEnabled, true)));

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of eligibleUsers) {
    if (!user.email) {
      skipped++;
      continue;
    }

    // Get check-ins from the past 7 days
    const recentCheckIns = await db
      .select({
        emotion: checkIns.emotion,
        intensity: checkIns.intensity,
        journalEntry: checkIns.journalEntry,
        createdAt: checkIns.createdAt,
        aieiProverb: aiResponses.aieiProverb,
        affirmation: aiResponses.affirmation,
        patternInsight: aiResponses.patternInsight,
      })
      .from(checkIns)
      .leftJoin(aiResponses, eq(aiResponses.checkInId, checkIns.id))
      .where(
        and(
          eq(checkIns.userId, user.id),
          gte(checkIns.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(checkIns.createdAt))
      .limit(7);

    if (recentCheckIns.length === 0) {
      skipped++;
      continue;
    }

    try {
      const summary = await generateWeeklySummary(
        user.name ?? "",
        recentCheckIns as WeeklyCheckIn[]
      );
      const ok = await sendWeeklyReflectionEmail(
        user as WeeklyUser,
        summary,
        recentCheckIns.length,
        appUrl
      );
      if (ok) sent++;
      else errors++;
    } catch {
      errors++;
    }
  }

  return { sent, skipped, errors };
}
