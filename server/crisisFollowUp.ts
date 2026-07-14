/**
 * crisisFollowUp.ts
 * Sends a gentle, generic check-in email roughly 24 hours after a crisis
 * event, gated on the user's notificationsEnabled preference. Deliberately
 * never mentions "crisis" or similar words in the email copy, in case the
 * message is glimpsed by someone other than the recipient.
 *
 * Called via GET /api/cron/crisis-follow-up (polled hourly).
 * Secured by a shared CRON_SECRET header.
 */

import { getDb } from "./db";
import { crisisEvents, users } from "../drizzle/schema";
import { and, eq, isNull, lte, inArray } from "drizzle-orm";
import { timingSafeEqual } from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "HeadCheck AI <notifications@headcheck.app>";
const CRON_SECRET = process.env.CRON_SECRET || "";

// ─── Email Template ───────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildFollowUpEmailHtml(userName: string, appUrl: string): string {
  const name = escapeHtml(userName || "there");
  const checkInUrl = escapeHtml(`${appUrl}/check-in`);
  const preferencesUrl = escapeHtml(`${appUrl}/profile?tab=notifications`);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thinking of you — HeadCheck AI</title>
</head>
<body style="margin:0;padding:0;background:#f8f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">💜</div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Thinking of you</h1>
    </div>
    <div style="background:#fff;border-radius:16px;padding:28px;margin-bottom:20px;box-shadow:0 2px 12px rgba(79,70,229,0.08);">
      <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 16px;">Hi ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 16px;">
        We wanted to check in and see how you're doing today. Life has its ups and downs, and we're glad you're here.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#374151;margin:0;">
        If you have a moment, a quick check-in can help you notice how you're feeling right now — no pressure, just a moment for yourself.
      </p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${checkInUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
        Check In →
      </a>
    </div>
    <div style="text-align:center;font-size:12px;color:#9ca3af;">
      <p style="margin:0 0 8px;">HeadCheck AI · A Real Time Emotional Response System</p>
      <p style="margin:0;">
        <a href="${preferencesUrl}" style="color:#6366f1;text-decoration:none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Sender ─────────────────────────────────────────────────────────────

async function sendCrisisFollowUpEmail(
  email: string,
  userName: string,
  appUrl: string
): Promise<boolean> {
  if (!RESEND_API_KEY) return false;

  const html = buildFollowUpEmailHtml(userName, appUrl);
  const name = userName || "there";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Thinking of you, ${name}`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

function isValidCronSecret(secret: string | undefined): boolean {
  if (!CRON_SECRET || !secret) return false;
  const provided = Buffer.from(secret);
  const expected = Buffer.from(CRON_SECRET);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function sendCrisisFollowUps(
  appUrl: string,
  secret?: string
): Promise<{ sent: number; skipped: number; errors: number }> {
  if (!isValidCronSecret(secret)) {
    throw new Error("Unauthorized");
  }

  const db = await getDb();
  if (!db) return { sent: 0, skipped: 0, errors: 0 };

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const qualifyingEvents = await db
    .select({
      eventId: crisisEvents.id,
      userId: crisisEvents.userId,
      userName: users.name,
      userEmail: users.email,
      notificationsEnabled: users.notificationsEnabled,
    })
    .from(crisisEvents)
    .innerJoin(users, eq(crisisEvents.userId, users.id))
    .where(
      and(
        isNull(crisisEvents.followUpSentAt),
        lte(crisisEvents.createdAt, cutoff)
      )
    );

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // Group qualifying events by user so each user gets at most one email.
  const eventsByUser = new Map<number, typeof qualifyingEvents>();
  for (const event of qualifyingEvents) {
    const existing = eventsByUser.get(event.userId);
    if (existing) {
      existing.push(event);
    } else {
      eventsByUser.set(event.userId, [event]);
    }
  }

  for (const [, userEvents] of Array.from(eventsByUser.entries())) {
    const first = userEvents[0];
    const eventIds = userEvents.map((e) => e.eventId);

    if (!first.notificationsEnabled || !first.userEmail) {
      await db
        .update(crisisEvents)
        .set({ followUpSentAt: new Date() })
        .where(inArray(crisisEvents.id, eventIds));
      skipped++;
      continue;
    }

    try {
      const ok = await sendCrisisFollowUpEmail(
        first.userEmail,
        first.userName ?? "",
        appUrl
      );
      if (ok) {
        await db
          .update(crisisEvents)
          .set({ followUpSentAt: new Date() })
          .where(inArray(crisisEvents.id, eventIds));
        sent++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return { sent, skipped, errors };
}
