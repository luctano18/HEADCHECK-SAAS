/**
 * reminderScheduler.ts
 * Sends smart check-in reminder emails and push notifications to users
 * who have enabled reminders and whose scheduled time matches the current hour.
 *
 * Called via GET /api/cron/send-reminders (triggered by an external cron service
 * or manually from the admin panel).
 */
import { getDb } from "./db";
import { users, pushSubscriptions } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "HeadCheck AI <notifications@headcheck.app>";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReminderUser {
  id: number;
  name: string | null;
  email: string | null;
  reminderTime: string | null;
  reminderDays: string | null;
  timezone: string | null;
}

// ─── Email ────────────────────────────────────────────────────────────────────
async function sendReminderEmail(user: ReminderUser, appUrl: string): Promise<boolean> {
  if (!RESEND_API_KEY || !user.email) return false;
  const name = user.name ?? "there";
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f8f7ff;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr><td style="background:linear-gradient(135deg,#6d28d9,#f59e0b);padding:28px 32px;color:white;">
              <h1 style="margin:0;font-size:22px;font-weight:800;">💜 HeadCheck AI</h1>
              <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Your Daily Wellness Check-In</p>
            </td></tr>
            <tr><td style="padding:28px 32px;">
              <p style="font-size:16px;color:#374151;margin:0 0 12px;">Hey ${name} 👋</p>
              <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 20px;">
                It's time for your daily emotional check-in. Taking just 2 minutes to reflect on how you're feeling 
                can make a real difference in your mental wellness journey.
              </p>
              <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px;">
                <em>"The first step to understanding your emotions is simply acknowledging them."</em>
              </p>
              <a href="${appUrl}/checkin" 
                 style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
                Start My Check-In →
              </a>
              <p style="font-size:12px;color:#9ca3af;margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;">
                You're receiving this because you enabled daily reminders in HeadCheck AI. 
                <a href="${appUrl}/profile" style="color:#7c3aed;">Manage your reminder settings</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
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
        subject: "💜 Time for your HeadCheck — How are you feeling today?",
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Push Notification ────────────────────────────────────────────────────────
async function sendReminderPush(userId: number, appUrl: string): Promise<void> {
  try {
    const { sendPushToUsers } = await import("./webpush");
    await sendPushToUsers([userId], {
      title: "💜 Time for your HeadCheck",
      body: "How are you feeling today? Take 2 minutes to check in.",
      url: `${appUrl}/checkin`,
      tag: "daily-reminder",
    });
  } catch {
    // Push is best-effort — ignore errors
  }
}

// ─── Main Scheduler ───────────────────────────────────────────────────────────
export async function sendDueReminders(appUrl: string): Promise<{ sent: number; errors: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, errors: 0 };

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentDay = now.getUTCDay(); // 0=Sun, 6=Sat

  // Fetch all users with reminders enabled
  const reminderUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      reminderTime: users.reminderTime,
      reminderDays: users.reminderDays,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.reminderEnabled, true));

  let sent = 0;
  let errors = 0;

  for (const user of reminderUsers) {
    try {
      // Parse reminder time (HH:MM)
      const [rHour, rMinute] = (user.reminderTime ?? "08:00").split(":").map(Number);
      // Parse reminder days (comma-separated 0-6)
      const rDays = (user.reminderDays ?? "1,2,3,4,5")
        .split(",")
        .map((d) => parseInt(d.trim(), 10));

      // Check if current UTC time matches (within the same hour)
      const hourMatch = rHour === currentHour && rMinute <= currentMinute && currentMinute < rMinute + 60;
      const dayMatch = rDays.includes(currentDay);

      if (!hourMatch || !dayMatch) continue;

      // Send email + push in parallel
      const [emailOk] = await Promise.allSettled([
        sendReminderEmail(user, appUrl),
        sendReminderPush(user.id, appUrl),
      ]);

      if (emailOk.status === "fulfilled" && emailOk.value) {
        sent++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return { sent, errors };
}
