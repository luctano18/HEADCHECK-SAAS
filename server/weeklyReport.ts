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
  // emotion trend: top-5 emotions × 7 days
  emotionTrend: {
    emotion: string;
    color: string;
    points: { day: string; count: number }[];
  }[];
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

// ─── Monthly Report Data Collection ───────────────────────────────────────────

export interface MonthlyReportData extends WeeklyReportData {
  month: string; // e.g. "June 2026"
}

/** Collecte les données pour un rapport mensuel */
export async function collectMonthlyReportData(
  institutionId: number,
  institutionName: string
): Promise<MonthlyReportData> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  // Récupérer tous les check-ins du mois
  const monthCheckIns = await db
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
        gte(checkIns.createdAt, monthStart)
      )
    )
    .orderBy(desc(checkIns.createdAt));

  // Crisis & Violence
  const monthCrisis = await db
    .select({ id: crisisEvents.id, acknowledged: crisisEvents.acknowledged })
    .from(crisisEvents)
    .innerJoin(users, eq(crisisEvents.userId, users.id))
    .where(
      and(
        eq(users.institutionId, institutionId),
        gte(crisisEvents.createdAt, monthStart)
      )
    );

  const monthFlags = await db
    .select({ id: violenceFlags.id, acknowledged: violenceFlags.acknowledged })
    .from(violenceFlags)
    .innerJoin(users, eq(violenceFlags.userId, users.id))
    .where(
      and(
        eq(users.institutionId, institutionId),
        gte(violenceFlags.createdAt, monthStart)
      )
    );

  const totalCheckIns = monthCheckIns.length;
  const uniqueStudents = new Set(monthCheckIns.map((c) => c.userId)).size;

  // Emotion distribution
  const emotionCounts: Record<string, number> = {};
  for (const c of monthCheckIns) {
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

  const scores = monthCheckIns.map((c) => (c.emotion ? EMOTION_SCORE[c.emotion] ?? 2.5 : 2.5));
  const avgEmotionScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

  // Daily check-ins (grouped by day of month)
  const dailyMap: Record<string, number> = {};
  for (const c of monthCheckIns) {
    const day = c.createdAt.getDate().toString();
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  }
  const dailyCheckIns = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

  const resolvedAlerts =
    monthCrisis.filter((c) => c.acknowledged).length +
    monthFlags.filter((f) => f.acknowledged).length;

  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return {
    institutionName,
    weekStart: monthStart,
    weekEnd: monthEnd,
    month: monthName,
    totalCheckIns,
    uniqueStudents,
    avgEmotionScore,
    topEmotions,
    crisisAlerts: monthCrisis.length,
    violenceFlags: monthFlags.length,
    resolvedAlerts,
    avgFeedbackRating: null,
    dailyCheckIns,
    emotionDistribution,
    emotionTrend: [],
  };
}

// ─── Group Report Data Collection ─────────────────────────────────────────────

export interface GroupReportData extends WeeklyReportData {
  groupName: string;
}

/** Collecte les données pour un rapport d’un groupe spécifique */
export async function collectGroupReportData(
  groupId: number,
  groupName: string,
  institutionName: string
): Promise<GroupReportData> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setHours(23, 59, 59, 999);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  // Récupérer les utilisateurs du groupe
  const groupUsers = await db.select({ id: users.id }).from(users).where(eq(users.groupId, groupId));
  const userIds = groupUsers.map(u => u.id);

  if (userIds.length === 0) {
    return {
      institutionName,
      groupName,
      weekStart,
      weekEnd,
      totalCheckIns: 0,
      uniqueStudents: 0,
      avgEmotionScore: 0,
      topEmotions: [],
      crisisAlerts: 0,
      violenceFlags: 0,
      resolvedAlerts: 0,
      avgFeedbackRating: null,
      dailyCheckIns: [],
      emotionDistribution: [],
      emotionTrend: [],
    };
  }

  // Check-ins du groupe
  const groupCheckIns = await db
    .select({
      id: checkIns.id,
      userId: checkIns.userId,
      emotion: checkIns.emotion,
      createdAt: checkIns.createdAt,
    })
    .from(checkIns)
    .where(
      and(
        sql`${checkIns.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
        gte(checkIns.createdAt, weekStart)
      )
    )
    .orderBy(desc(checkIns.createdAt));

  const totalCheckIns = groupCheckIns.length;
  const uniqueStudents = new Set(groupCheckIns.map((c) => c.userId)).size;

  const emotionCounts: Record<string, number> = {};
  for (const c of groupCheckIns) {
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

  const scores = groupCheckIns.map((c) => (c.emotion ? EMOTION_SCORE[c.emotion] ?? 2.5 : 2.5));
  const avgEmotionScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyMap[days[d.getDay()]] = 0;
  }
  for (const c of groupCheckIns) {
    const dayName = days[new Date(c.createdAt).getDay()];
    if (dayName in dailyMap) dailyMap[dayName]++;
  }
  const dailyCheckIns = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

  return {
    institutionName,
    groupName,
    weekStart,
    weekEnd,
    totalCheckIns,
    uniqueStudents,
    avgEmotionScore,
    topEmotions,
    crisisAlerts: 0,
    violenceFlags: 0,
    resolvedAlerts: 0,
    avgFeedbackRating: null,
    dailyCheckIns,
    emotionDistribution,
    emotionTrend: [],
  };
}

// ─── Comparative Report (Two Periods) ─────────────────────────────────────────

export interface ComparativeReportData {
  institutionName: string;
  period1: { label: string; start: Date; end: Date; totalCheckIns: number; avgIntensity: number; topEmotions: any[]; crisisAlerts: number; violenceFlags: number };
  period2: { label: string; start: Date; end: Date; totalCheckIns: number; avgIntensity: number; topEmotions: any[]; crisisAlerts: number; violenceFlags: number };
  comparison: {
    checkInsDelta: number;
    intensityDelta: number;
    crisisDelta: number;
    violenceDelta: number;
  };
}

export async function collectComparativeReportData(
  institutionId: number,
  institutionName: string,
  days1: number = 30,
  days2: number = 30
): Promise<ComparativeReportData> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const now = new Date();

  // Period 1 (most recent)
  const p1End = new Date(now);
  const p1Start = new Date(now);
  p1Start.setDate(p1Start.getDate() - days1);

  // Period 2 (previous)
  const p2End = new Date(p1Start);
  const p2Start = new Date(p1Start);
  p2Start.setDate(p2Start.getDate() - days2);

  const getPeriodData = async (start: Date, end: Date) => {
    const checkInsData = await db
      .select({
        id: checkIns.id,
        userId: checkIns.userId,
        emotion: checkIns.emotion,
        intensity: checkIns.intensity,
        createdAt: checkIns.createdAt,
      })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .where(
        and(
          eq(users.institutionId, institutionId),
          gte(checkIns.createdAt, start),
          sql`${checkIns.createdAt} <= ${end}`
        )
      );

    const crisis = await db
      .select({ id: crisisEvents.id })
      .from(crisisEvents)
      .innerJoin(users, eq(crisisEvents.userId, users.id))
      .where(
        and(
          eq(users.institutionId, institutionId),
          gte(crisisEvents.createdAt, start),
          sql`${crisisEvents.createdAt} <= ${end}`
        )
      );

    const violence = await db
      .select({ id: violenceFlags.id })
      .from(violenceFlags)
      .innerJoin(users, eq(violenceFlags.userId, users.id))
      .where(
        and(
          eq(users.institutionId, institutionId),
          gte(violenceFlags.createdAt, start),
          sql`${violenceFlags.createdAt} <= ${end}`
        )
      );

    const total = checkInsData.length;
    const avgIntensity = total > 0
      ? Math.round((checkInsData.reduce((s, c) => s + c.intensity, 0) / total) * 10) / 10
      : 0;

    const emotionCounts: Record<string, number> = {};
    checkInsData.forEach(c => {
      emotionCounts[c.emotion] = (emotionCounts[c.emotion] ?? 0) + 1;
    });
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));

    return {
      totalCheckIns: total,
      avgIntensity,
      topEmotions,
      crisisAlerts: crisis.length,
      violenceFlags: violence.length,
    };
  };

  const p1 = await getPeriodData(p1Start, p1End);
  const p2 = await getPeriodData(p2Start, p2End);

  return {
    institutionName,
    period1: {
      label: `Last ${days1} days`,
      start: p1Start,
      end: p1End,
      ...p1,
    },
    period2: {
      label: `Previous ${days2} days`,
      start: p2Start,
      end: p2End,
      ...p2,
    },
    comparison: {
      checkInsDelta: p1.totalCheckIns - p2.totalCheckIns,
      intensityDelta: Math.round((p1.avgIntensity - p2.avgIntensity) * 10) / 10,
      crisisDelta: p1.crisisAlerts - p2.crisisAlerts,
      violenceDelta: p1.violenceFlags - p2.violenceFlags,
    },
  };
}

// ─── Original Weekly Report (unchanged) ───────────────────────────────────────
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

  // ── Emotion trend: top-5 emotions × 7 days ──────────────────────────────
  // New brand palette: Indigo primary, Coral accent, Teal, Amber, Rose
  const TREND_COLORS = ["#4338CA", "#F97316", "#0D9488", "#F59E0B", "#E11D48"];
  const top5Emotions = topEmotions.slice(0, 5).map((e) => e.emotion);
  const dayKeys = Object.keys(dailyMap); // ordered Sun…Sat for the week

  // Build a map: emotion → day → count
  const trendMap: Record<string, Record<string, number>> = {};
  for (const em of top5Emotions) {
    trendMap[em] = {};
    for (const dk of dayKeys) trendMap[em][dk] = 0;
  }
  for (const c of weekCheckIns) {
    if (!c.emotion || !top5Emotions.includes(c.emotion)) continue;
    const dayName = days[new Date(c.createdAt).getDay()];
    if (dayName in trendMap[c.emotion]) trendMap[c.emotion][dayName]++;
  }

  const emotionTrend = top5Emotions.map((emotion, i) => ({
    emotion,
    color: TREND_COLORS[i % TREND_COLORS.length],
    points: dayKeys.map((dk) => ({ day: dk, count: trendMap[emotion][dk] })),
  }));

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
    emotionTrend,
  };
}

// ─── SVG Line Chart Generator ───────────────────────────────────────────────

function buildEmotionTrendSvg(
  trend: WeeklyReportData["emotionTrend"],
  dailyCheckIns: WeeklyReportData["dailyCheckIns"]
): string {
  if (trend.length === 0) {
    return `<div style="text-align:center;padding:40px;color:#9ca3af;font-size:13px;font-style:italic;">No check-in data available for trend analysis.</div>`;
  }

  const W = 680;  // SVG width
  const H = 200;  // SVG height
  const PAD_L = 36; // left padding for Y axis labels
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28; // bottom padding for X axis labels
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const n = dailyCheckIns.length; // 7 days
  // Max count across all emotions + days
  const allCounts = trend.flatMap((t) => t.points.map((p) => p.count));
  const maxY = Math.max(...allCounts, 1);

  // X position for day index i (0..n-1)
  const xPos = (i: number) => PAD_L + (i / (n - 1)) * innerW;
  // Y position for count value
  const yPos = (v: number) => PAD_T + innerH - (v / maxY) * innerH;

  // Y-axis grid lines (4 levels)
  const yLevels = [0, 0.25, 0.5, 0.75, 1.0].map((f) => Math.round(f * maxY));
  const gridLines = yLevels
    .map((v) => {
      const y = yPos(v);
      return `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e0e7ff" stroke-width="1" stroke-dasharray="4,3"/>
              <text x="${PAD_L - 4}" y="${y + 4}" text-anchor="end" font-size="9" fill="#9ca3af">${v}</text>`;
    })
    .join("");

  // X-axis day labels
  const xLabels = dailyCheckIns
    .map((d, i) => `<text x="${xPos(i)}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#6b7280">${d.day}</text>`)
    .join("");

  // One polyline + dots per emotion
  const lines = trend
    .map((series) => {
      const pts = series.points
        .map((p, i) => `${xPos(i).toFixed(1)},${yPos(p.count).toFixed(1)}`)
        .join(" ");

      // Area fill (semi-transparent)
      const areaFirst = `${xPos(0).toFixed(1)},${(PAD_T + innerH).toFixed(1)}`;
      const areaLast = `${xPos(n - 1).toFixed(1)},${(PAD_T + innerH).toFixed(1)}`;
      const areaPath = `M ${areaFirst} L ${pts.split(" ").map((p) => `${p}`).join(" L ")} L ${areaLast} Z`;

      const dots = series.points
        .map(
          (p, i) =>
            `<circle cx="${xPos(i).toFixed(1)}" cy="${yPos(p.count).toFixed(1)}" r="3.5" fill="${series.color}" stroke="white" stroke-width="1.5"/>`
        )
        .join("");

      return `
        <path d="${areaPath}" fill="${series.color}" fill-opacity="0.07"/>
        <polyline points="${pts}" fill="none" stroke="${series.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}`;
    })
    .join("");

  // Legend
  const legendItems = trend
    .map(
      (s, i) =>
        `<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:11px;color:#374151;">
          <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round"/></svg>
          ${s.emotion}
        </span>`
    )
    .join("");

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid -->
      ${gridLines}
      <!-- Series -->
      ${lines}
      <!-- X labels -->
      ${xLabels}
    </svg>
    <div style="margin-top:10px;">${legendItems}</div>
  `;
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
          <span style="font-size:11px;font-weight:600;color:#4338CA;">${count}</span>
          <div style="width:100%;background:#e0e7ff;border-radius:4px;height:80px;display:flex;align-items:flex-end;">
            <div style="width:100%;background:linear-gradient(180deg,#4338CA,#818CF8);border-radius:4px;height:${height}px;"></div>
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
            <div style="background:linear-gradient(90deg,#4338CA,#818CF8);height:100%;width:${percentage}%;border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#4338CA;">${percentage}%</td>
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
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5ff; color: #1f2937; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    .header { background: linear-gradient(135deg, #3730A3, #F97316); border-radius: 16px; padding: 32px; color: white; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; opacity: 0.85; margin-top: 4px; }
    .period { font-size: 13px; opacity: 0.75; margin-top: 8px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .card-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 8px; }
    .card-value { font-size: 32px; font-weight: 800; color: #1f2937; line-height: 1; }
    .card-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #c7d2fe; }
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

  <!-- Emotion Trend Chart -->
  <div class="card" style="margin-bottom:24px;">
    <div class="section-title">📈 Emotion Trend — Last 7 Days</div>
    <p style="font-size:12px;color:#9ca3af;margin-bottom:12px;">Daily count of the top ${data.emotionTrend.length > 0 ? data.emotionTrend.length : "reported"} emotions across the institution.</p>
    ${buildEmotionTrendSvg(data.emotionTrend, data.dailyCheckIns)}
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
              ["#e0e7ff", "#fff7ed", "#ccfbf1", "#fef3c7", "#ffe4e6"][i % 5]
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
      <div style="background:linear-gradient(135deg,#3730A3,#F97316);border-radius:16px;padding:28px 32px;color:white;margin-bottom:24px;">
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
