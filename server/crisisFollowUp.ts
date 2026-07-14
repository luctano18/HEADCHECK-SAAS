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
  const checkInUrl = `${appUrl}/check-in`;
  const preferencesUrl = `${appUrl}/profile?tab=notifications`;

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
