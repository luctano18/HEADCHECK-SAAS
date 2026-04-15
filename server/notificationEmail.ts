/**
 * Resend email notification service for HeadCheck AI
 * Sends branded HTML emails to admins/superadmins on key events.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "HeadCheck AI <notifications@headcheck.app>";

export type NotifEmailType =
  | "crisis_alert"
  | "violence_flag"
  | "alert_assigned"
  | "new_comment"
  | "new_checkin";

interface SendNotifEmailParams {
  to: string;
  type: NotifEmailType;
  title: string;
  body: string;
  link?: string;
  recipientName?: string;
}

function buildHtml(params: SendNotifEmailParams): string {
  const { type, title, body, link, recipientName } = params;

  const colorMap: Record<NotifEmailType, { bg: string; accent: string; icon: string }> = {
    crisis_alert:   { bg: "#FEF2F2", accent: "#DC2626", icon: "🚨" },
    violence_flag:  { bg: "#FFF7ED", accent: "#EA580C", icon: "⚠️" },
    alert_assigned: { bg: "#EFF6FF", accent: "#2563EB", icon: "👤" },
    new_comment:    { bg: "#F0FDF4", accent: "#16A34A", icon: "💬" },
    new_checkin:    { bg: "#FAF5FF", accent: "#7C3AED", icon: "📋" },
  };

  const { bg, accent, icon } = colorMap[type];
  const ctaHtml = link
    ? `<a href="${link}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Alert →</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8f7ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6d28d9,#f59e0b);padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">💜 HeadCheck AI</span></td>
              <td align="right"><span style="font-size:28px;">${icon}</span></td>
            </tr>
          </table>
        </td></tr>
        <!-- Alert banner -->
        <tr><td style="background:${bg};padding:16px 32px;border-left:4px solid ${accent};">
          <p style="margin:0;font-size:13px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:1px;">${type.replace(/_/g, " ")}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${recipientName ? `<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Hello, <strong>${recipientName}</strong></p>` : ""}
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1f2937;">${title}</h2>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">${body}</p>
          ${ctaHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
            This notification was sent by <strong>HeadCheck AI</strong> because you have an admin role.<br>
            Identities are anonymized in accordance with our privacy policy.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendNotificationEmail(params: SendNotifEmailParams): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: `[HeadCheck AI] ${params.title}`,
        html: buildHtml(params),
      }),
    });
    const data = await res.json() as { id?: string; statusCode?: number };
    return res.ok && !!data.id;
  } catch (err) {
    console.error("[Resend] Failed to send notification email:", err);
    return false;
  }
}
