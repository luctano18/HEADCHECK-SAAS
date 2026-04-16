/**
 * weeklyReport.ts
 * Generates a branded weekly PDF report for institution admins.
 * Uses puppeteer-core + @sparticuz/chromium-min for server-side PDF rendering.
 * Sends the PDF as an email attachment via Resend.
 */
import { getDb } from "./db";
import {
  checkIns,
  crisisEvents,
  violenceFlags,
  users,
  aiResponses,
} from "../drizzle/schema";
import { and, eq, gte, sql, desc } from "drizzle-orm";

// ─── Data Collection ──────────────────────────────────────────────────────────

export interface WeeklyReportData {
  institutionName: string;
  weekStart: Date;
  weekEnd: Date;
  totalCheckIns: number;
  uniqueStudents: number;
  avgEmotionScore: number; // 1-5 scale derived from emotion
  topEmotions: { emotion: string; count: number }[];
  crisisAlerts: number;
  violenceFlags: number;
  resolvedAlerts: number;
  avgFeedbackRating: number | null;
  dailyCheckIns: { day: string; count: number }[];
  emotionDistribution: { emotion: string; percentage: number }[];
}

const EMOTION_SCORE: Record<string, number> = {
  "Hopeful but uncertain": 4,
  "Overwhelmed": 2,
  "Anxious": 2,
  "Stressed": 2,
  "Sad": 1.5,
  "Angry": 1.5,
  "Discouraged": 1.5,
  "Numb": 1,
  "Confused": 2,
  "Frustrated": 2,
};

export async function collectWeeklyReportData(
  institutionId: number,
  institutionName: string
): Promise<WeeklyReportData> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setHours(23, 59, 59, 999);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  // All check-ins this week for students in this institution
  const weekCheckIns = await db
    .select({
      id: checkIns.id,
      userId: checkIns.userId,
      emotion: checkIns.emotion,
      createdAt: checkIns.createdAt,
    })
    .from(checkIns)
    .innerJoin(users, eq(checkIns.userId, users.id))
    .where(
      and(
        eq(users.institutionId, institutionId),
        gte(checkIns.createdAt, weekStart)
      )
    )
    .orderBy(desc(checkIns.createdAt));

  // Crisis events this week
  const weekCrisis = await db
    .select({ id: crisisEvents.id, acknowledged: crisisEvents.acknowledged })
    .from(crisisEvents)
    .innerJoin(users, eq(crisisEvents.userId, users.id))
    .where(
      and(
        eq(users.institutionId, institutionId),
        gte(crisisEvents.createdAt, weekStart)
      )
    );

  // Violence flags this week
  const weekFlags = await db
    .select({ id: violenceFlags.id, acknowledged: violenceFlags.acknowledged })
    .from(violenceFlags)
    .innerJoin(users, eq(violenceFlags.userId, users.id))
    .where(
      and(
        eq(users.institutionId, institutionId),
        gte(violenceFlags.createdAt, weekStart)
      )
    );

  // AI response feedback ratings this week
  const weekFeedback = await db
    .select({ feedbackRating: aiResponses.feedbackRating })
    .from(aiResponses)
    .innerJoin(users, eq(aiResponses.userId, users.id))
    .where(
      and(
        eq(users.institutionId, institutionId),
        gte(aiResponses.createdAt, weekStart),
        sql`${aiResponses.feedbackRating} IS NOT NULL`
      )
    );

  // Compute stats
  const totalCheckIns = weekCheckIns.length;
  const uniqueStudents = new Set(weekCheckIns.map((c) => c.userId)).size;

  // Emotion distribution
  const emotionCounts: Record<string, number> = {};
  for (const c of weekCheckIns) {
    if (c.emotion) emotionCounts[c.emotion] = (emotionCounts[c.emotion] ?? 0) + 1;
  }
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion, count]) => ({ emotion, count }));

  const emotionDistribution = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([emotion, count]) => ({
      emotion,
      percentage: totalCheckIns > 0 ? Math.round((count / totalCheckIns) * 100) : 0,
    }));

  // Average emotion score
  const scores = weekCheckIns
    .map((c) => (c.emotion ? EMOTION_SCORE[c.emotion] ?? 2.5 : 2.5));
  const avgEmotionScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

  // Daily check-ins (last 7 days)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyMap[days[d.getDay()]] = 0;
  }
  for (const c of weekCheckIns) {
    const dayName = days[new Date(c.createdAt).getDay()];
    if (dayName in dailyMap) dailyMap[dayName]++;
  }
  const dailyCheckIns = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

  // Feedback
  const helpfulCount = weekFeedback.filter((f) => f.feedbackRating === "helpful").length;
  const avgFeedbackRating =
    weekFeedback.length > 0
      ? Math.round((helpfulCount / weekFeedback.length) * 100)
      : null;

  const resolvedAlerts =
    weekCrisis.filter((c) => c.acknowledged).length +
    weekFlags.filter((f) => f.acknowledged).length;

  return {
    institutionName,
    weekStart,
    weekEnd,
    totalCheckIns,
    uniqueStudents,
    avgEmotionScore,
    topEmotions,
    crisisAlerts: weekCrisis.length,
    violenceFlags: weekFlags.length,
    resolvedAlerts,
    avgFeedbackRating,
    dailyCheckIns,
    emotionDistribution,
  };
}

// ─── HTML Template ────────────────────────────────────────────────────────────

export function buildReportHtml(data: WeeklyReportData): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const emotionColor = (score: number) => {
    if (score >= 3.5) return "#16a34a";
    if (score >= 2.5) return "#d97706";
    return "#dc2626";
  };

  const barChart = data.dailyCheckIns
    .map(({ day, count }) => {
      const maxCount = Math.max(...data.dailyCheckIns.map((d) => d.count), 1);
      const height = Math.max(4, Math.round((count / maxCount) * 80));
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
          <span style="font-size:11px;font-weight:600;color:#6d28d9;">${count}</span>
          <div style="width:100%;background:#e0e7ff;border-radius:4px;height:80px;display:flex;align-items:flex-end;">
            <div style="width:100%;background:linear-gradient(180deg,#7c3aed,#a78bfa);border-radius:4px;height:${height}px;"></div>
          </div>
          <span style="font-size:11px;color:#6b7280;">${day}</span>
        </div>`;
    })
    .join("");

  const emotionRows = data.emotionDistribution
    .map(
      ({ emotion, percentage }) => `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#374151;">${emotion}</td>
        <td style="padding:8px 0;width:60%;">
          <div style="background:#e0e7ff;border-radius:4px;height:10px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#7c3aed,#a78bfa);height:100%;width:${percentage}%;border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#6d28d9;">${percentage}%</td>
      </tr>`
    )
    .join("");

  const feedbackHtml =
    data.avgFeedbackRating !== null
      ? `<div style="text-align:center;"><span style="font-size:28px;font-weight:800;color:#16a34a;">${data.avgFeedbackRating}%</span><p style="font-size:12px;color:#6b7280;margin:2px 0 0;">found AI insights helpful</p></div>`
      : `<div style="text-align:center;"><span style="font-size:14px;color:#9ca3af;font-style:italic;">No feedback yet</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>HeadCheck Weekly Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f7ff; color: #1f2937; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    .header { background: linear-gradient(135deg, #6d28d9, #f59e0b); border-radius: 16px; padding: 32px; color: white; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; opacity: 0.85; margin-top: 4px; }
    .period { font-size: 13px; opacity: 0.75; margin-top: 8px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .card-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 8px; }
    .card-value { font-size: 32px; font-weight: 800; color: #1f2937; line-height: 1; }
    .card-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e0e7ff; }
    .chart-container { display: flex; align-items: flex-end; gap: 8px; height: 100px; padding: 0 8px; }
    .alert-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-red { background: #fef2f2; color: #dc2626; }
    .badge-orange { background: #fff7ed; color: #ea580c; }
    .badge-green { background: #f0fdf4; color: #16a34a; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo">💜 HeadCheck AI</div>
    <div class="subtitle">Weekly Emotional Wellness Report — ${data.institutionName}</div>
    <div class="period">${fmt(data.weekStart)} – ${fmt(data.weekEnd)}</div>
  </div>

  <!-- KPI Cards -->
  <div class="grid-4">
    <div class="card">
      <div class="card-title">Total Check-Ins</div>
      <div class="card-value">${data.totalCheckIns}</div>
      <div class="card-sub">this week</div>
    </div>
    <div class="card">
      <div class="card-title">Unique Students</div>
      <div class="card-value">${data.uniqueStudents}</div>
      <div class="card-sub">participated</div>
    </div>
    <div class="card">
      <div class="card-title">Avg. Wellness Score</div>
      <div class="card-value" style="color:${emotionColor(data.avgEmotionScore)};">${data.avgEmotionScore}<span style="font-size:16px;">/5</span></div>
      <div class="card-sub">emotional baseline</div>
    </div>
    <div class="card">
      <div class="card-title">AI Helpfulness</div>
      ${feedbackHtml}
    </div>
  </div>

  <!-- Alert Summary -->
  <div class="card" style="margin-bottom:24px;">
    <div class="section-title">🚨 Alert Summary</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <span class="alert-badge badge-red">🚨 ${data.crisisAlerts} Crisis Alert${data.crisisAlerts !== 1 ? "s" : ""}</span>
      <span class="alert-badge badge-orange">⚠️ ${data.violenceFlags} Violence Flag${data.violenceFlags !== 1 ? "s" : ""}</span>
      <span class="alert-badge badge-green">✅ ${data.resolvedAlerts} Resolved</span>
    </div>
  </div>

  <!-- Charts Row -->
  <div class="grid-2">
    <!-- Daily Check-Ins Bar Chart -->
    <div class="card">
      <div class="section-title">📊 Daily Check-Ins</div>
      <div class="chart-container">
        ${barChart}
      </div>
    </div>

    <!-- Emotion Distribution -->
    <div class="card">
      <div class="section-title">💭 Emotion Distribution</div>
      <table style="width:100%;border-collapse:collapse;">
        ${emotionRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;font-size:13px;padding:16px;">No check-ins this week</td></tr>'}
      </table>
    </div>
  </div>

  <!-- Top Emotions -->
  ${
    data.topEmotions.length > 0
      ? `<div class="card" style="margin-bottom:24px;">
    <div class="section-title">🏆 Most Reported Emotions</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      ${data.topEmotions
        .map(
          ({ emotion, count }, i) =>
            `<span style="padding:8px 16px;border-radius:20px;background:${
              ["#ede9fe", "#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3"][i % 5]
            };font-size:13px;font-weight:600;color:#374151;">${emotion} <span style="opacity:0.6;">(${count})</span></span>`
        )
        .join("")}
    </div>
  </div>`
      : ""
  }

  <!-- Footer -->
  <div class="footer">
    <p>Generated automatically by HeadCheck AI · ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    <p style="margin-top:4px;">This report is confidential and intended for authorized staff only.</p>
  </div>
</div>
</body>
</html>`;
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

export async function generateReportPdf(html: string): Promise<Buffer> {
  // Dynamic import to avoid loading chromium at startup
  const chromium = await import("@sparticuz/chromium-min");
  const puppeteer = await import("puppeteer-core");

  const executablePath = await chromium.default.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
  );

  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    defaultViewport: { width: 1200, height: 900 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ─── Email Sending ────────────────────────────────────────────────────────────

export async function sendWeeklyReportEmail(params: {
  to: string;
  recipientName: string;
  institutionName: string;
  weekStart: Date;
  weekEnd: Date;
  pdfBase64: string;
}): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL || "HeadCheck AI <notifications@headcheck.app>";

  if (!RESEND_API_KEY) return false;

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const subject = `HeadCheck Weekly Report — ${params.institutionName} (${fmt(params.weekStart)} – ${fmt(params.weekEnd)})`;

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#f8f7ff;">
      <div style="background:linear-gradient(135deg,#6d28d9,#f59e0b);border-radius:16px;padding:28px 32px;color:white;margin-bottom:24px;">
        <h1 style="margin:0;font-size:22px;font-weight:800;">💜 HeadCheck AI</h1>
        <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Weekly Emotional Wellness Report</p>
      </div>
      <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="font-size:15px;color:#374151;">Hello ${params.recipientName},</p>
        <p style="font-size:14px;color:#6b7280;margin-top:12px;line-height:1.6;">
          Your weekly emotional wellness report for <strong>${params.institutionName}</strong> is attached. 
          It covers the period from <strong>${fmt(params.weekStart)}</strong> to <strong>${fmt(params.weekEnd)}</strong>.
        </p>
        <p style="font-size:14px;color:#6b7280;margin-top:12px;line-height:1.6;">
          The report includes check-in statistics, emotion trends, alert summaries, and AI feedback ratings.
        </p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
          This report is confidential and intended for authorized staff only. Generated automatically by HeadCheck AI.
        </p>
      </div>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: params.to,
        subject,
        html,
        attachments: [
          {
            filename: `headcheck-weekly-report-${fmt(params.weekStart).replace(/\s/g, "-")}.pdf`,
            content: params.pdfBase64,
          },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
