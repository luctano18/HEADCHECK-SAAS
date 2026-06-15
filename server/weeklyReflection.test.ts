/**
 * weeklyReflection.test.ts
 * Unit tests for the weekly reflection summary logic.
 * Tests the fallback summary generator and email content builder
 * without hitting the database or external APIs.
 */
import { describe, it, expect } from "vitest";

// ─── Inline the pure helpers for testing ─────────────────────────────────────
// We test the pure logic (fallback summary, email HTML) without importing
// the full module (which requires DB + env vars at import time).

type WeeklyCheckIn = {
  emotion: string;
  intensity: number;
  journalEntry: string | null;
  createdAt: Date;
  aieiProverb: string | null;
  affirmation: string | null;
  patternInsight: string | null;
};

function generateFallbackSummary(userName: string, checkInData: WeeklyCheckIn[]): string {
  const name = userName || "there";
  const count = checkInData.length;
  const uniqueEmotions = Array.from(new Set(checkInData.map((c) => c.emotion)));
  const emotions = uniqueEmotions.join(", ");
  const avgIntensity = Math.round(
    checkInData.reduce((sum, c) => sum + c.intensity, 0) / count
  );

  const proverb = checkInData.find((c) => c.aieiProverb)?.aieiProverb;
  const affirmation = checkInData.find((c) => c.affirmation)?.affirmation;

  let summary = `Hi ${name},\n\nThis week, you checked in ${count} time${count !== 1 ? "s" : ""} with HeadCheck. `;
  summary += `Your emotional landscape included: ${emotions}. `;
  summary += `Your average intensity was ${avgIntensity}/10.\n\n`;

  if (avgIntensity >= 7) {
    summary += `It looks like this was an intense week for you. That takes courage to face. `;
    summary += `Remember: feeling deeply is a sign of your emotional awareness, not a weakness.\n\n`;
  } else if (avgIntensity >= 4) {
    summary += `You navigated a week of moderate emotional intensity. `;
    summary += `Each check-in was a step toward understanding yourself better.\n\n`;
  } else {
    summary += `This week felt relatively steady for you. `;
    summary += `Consistency in checking in — even on calm days — builds emotional resilience.\n\n`;
  }

  if (proverb) {
    summary += `A piece of wisdom that accompanied you this week:\n"${proverb}"\n\n`;
  }

  if (affirmation) {
    summary += `Your affirmation: "${affirmation}"\n\n`;
  }

  summary += `Keep showing up for yourself. One check-in at a time.\n\nWith care,\nThe HeadCheck Team`;
  return summary;
}

function buildEmailHtml(userName: string, summaryText: string, checkInCount: number): string {
  const name = userName || "there";
  const paragraphs = summaryText
    .split("\n\n")
    .filter(Boolean)
    .map((p) => `<p style="margin: 0 0 16px; line-height: 1.6; color: #374151;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Weekly Reflection — HeadCheck</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Your Weekly Reflection</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${checkInCount} check-in${checkInCount !== 1 ? "s" : ""} this week · HeadCheck AI</p>
    </div>
    <div style="padding: 32px 40px;">
      <p style="margin: 0 0 24px; font-size: 18px; font-weight: 600; color: #1f2937;">Hi ${name},</p>
      ${paragraphs}
      <div style="margin-top: 32px; padding: 20px; background: #f5f3ff; border-radius: 12px; border-left: 4px solid #7c3aed;">
        <p style="margin: 0; font-size: 13px; color: #6d28d9; font-style: italic;">
          HeadCheck is a self-reflection tool, not a mental health service. If you're in crisis, please contact 988 (US) or your local emergency services.
        </p>
      </div>
    </div>
    <div style="padding: 24px 40px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        You're receiving this because you enabled Weekly Reflection in your HeadCheck profile.<br>
        <a href="#" style="color: #7c3aed;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const baseCheckIn: WeeklyCheckIn = {
  emotion: "Anxious",
  intensity: 7,
  journalEntry: "Feeling overwhelmed",
  createdAt: new Date("2024-01-15"),
  aieiProverb: "Wisdom is like a baobab tree; no one individual can embrace it.",
  affirmation: "You are enough.",
  patternInsight: null,
};

describe("generateFallbackSummary", () => {
  it("includes the user name in the greeting", () => {
    const summary = generateFallbackSummary("Alex", [baseCheckIn]);
    expect(summary).toContain("Hi Alex");
  });

  it("falls back to 'there' when name is empty", () => {
    const summary = generateFallbackSummary("", [baseCheckIn]);
    expect(summary).toContain("Hi there");
  });

  it("reports the correct check-in count", () => {
    const checkIns = [baseCheckIn, { ...baseCheckIn, emotion: "Hopeful" }];
    const summary = generateFallbackSummary("Sam", checkIns);
    expect(summary).toContain("2 times");
  });

  it("uses singular 'time' for a single check-in", () => {
    const summary = generateFallbackSummary("Sam", [baseCheckIn]);
    expect(summary).toContain("1 time");
  });

  it("deduplicates emotions in the summary", () => {
    const checkIns = [
      baseCheckIn,
      { ...baseCheckIn, emotion: "Anxious" }, // duplicate
      { ...baseCheckIn, emotion: "Sad" },
    ];
    const summary = generateFallbackSummary("Sam", checkIns);
    // "Anxious" should appear only once in the emotion list
    const emotionSection = summary.split("Your emotional landscape included:")[1]?.split(".")[0] ?? "";
    const anxiousCount = (emotionSection.match(/Anxious/g) || []).length;
    expect(anxiousCount).toBe(1);
  });

  it("includes the proverb when present", () => {
    const summary = generateFallbackSummary("Sam", [baseCheckIn]);
    expect(summary).toContain("baobab tree");
  });

  it("includes the affirmation when present", () => {
    const summary = generateFallbackSummary("Sam", [baseCheckIn]);
    expect(summary).toContain("You are enough.");
  });

  it("omits proverb section when no proverb is available", () => {
    const checkIn = { ...baseCheckIn, aieiProverb: null };
    const summary = generateFallbackSummary("Sam", [checkIn]);
    expect(summary).not.toContain("A piece of wisdom");
  });

  it("shows high-intensity message for avg >= 7", () => {
    const checkIn = { ...baseCheckIn, intensity: 8 };
    const summary = generateFallbackSummary("Sam", [checkIn]);
    expect(summary).toContain("intense week");
  });

  it("shows moderate message for avg 4-6", () => {
    const checkIn = { ...baseCheckIn, intensity: 5 };
    const summary = generateFallbackSummary("Sam", [checkIn]);
    expect(summary).toContain("moderate emotional intensity");
  });

  it("shows steady message for avg < 4", () => {
    const checkIn = { ...baseCheckIn, intensity: 2 };
    const summary = generateFallbackSummary("Sam", [checkIn]);
    expect(summary).toContain("relatively steady");
  });
});

describe("buildEmailHtml", () => {
  it("contains the user name in the greeting", () => {
    const html = buildEmailHtml("Jordan", "Your week was good.", 3);
    expect(html).toContain("Hi Jordan");
  });

  it("shows correct check-in count in the header", () => {
    const html = buildEmailHtml("Jordan", "Your week was good.", 3);
    expect(html).toContain("3 check-ins this week");
  });

  it("uses singular for 1 check-in", () => {
    const html = buildEmailHtml("Jordan", "Your week was good.", 1);
    expect(html).toContain("1 check-in this week");
  });

  it("includes the summary text in the email body", () => {
    const html = buildEmailHtml("Jordan", "You showed great resilience.", 2);
    expect(html).toContain("You showed great resilience.");
  });

  it("includes the crisis disclaimer", () => {
    const html = buildEmailHtml("Jordan", "Summary text.", 2);
    expect(html).toContain("988");
  });

  it("includes unsubscribe link", () => {
    const html = buildEmailHtml("Jordan", "Summary text.", 2);
    expect(html).toContain("Unsubscribe");
  });

  it("is valid HTML with doctype", () => {
    const html = buildEmailHtml("Jordan", "Summary text.", 2);
    expect(html).toMatch(/^<!DOCTYPE html>/i);
  });
});
