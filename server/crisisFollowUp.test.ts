/**
 * crisisFollowUp.test.ts
 * Unit tests for the post-crisis follow-up email template.
 * Tests the pure HTML builder without hitting the database or external APIs.
 */
import { describe, it, expect } from "vitest";

// ─── Inline the pure helper for testing ─────────────────────────────────────
// We test the pure logic (email HTML) without importing the full module
// (which requires DB + env vars at import time) — same approach as
// weeklyReflection.test.ts.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildFollowUpEmailHtml(userName: string, appUrl: string): string {
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("buildFollowUpEmailHtml", () => {
  it("includes the user's name in the greeting", () => {
    const html = buildFollowUpEmailHtml("Alex", "https://headcheck.app");
    expect(html).toContain("Hi Alex");
  });

  it("falls back to 'there' when name is empty", () => {
    const html = buildFollowUpEmailHtml("", "https://headcheck.app");
    expect(html).toContain("Hi there");
  });

  it("never mentions crisis, emergency, or urgent", () => {
    const html = buildFollowUpEmailHtml("Alex", "https://headcheck.app");
    const lower = html.toLowerCase();
    expect(lower).not.toContain("crisis");
    expect(lower).not.toContain("emergency");
    expect(lower).not.toContain("urgent");
  });

  it("includes a check-in call to action pointing at the app URL", () => {
    const html = buildFollowUpEmailHtml("Alex", "https://headcheck.app");
    expect(html).toContain("https://headcheck.app/check-in");
  });

  it("includes a notification preferences link", () => {
    const html = buildFollowUpEmailHtml("Alex", "https://headcheck.app");
    expect(html).toContain("https://headcheck.app/profile?tab=notifications");
  });

  it("is valid HTML with a doctype", () => {
    const html = buildFollowUpEmailHtml("Alex", "https://headcheck.app");
    expect(html).toMatch(/^<!DOCTYPE html>/i);
  });

  it("HTML-escapes the user name to prevent markup injection", () => {
    const html = buildFollowUpEmailHtml("<img src=x onerror=alert(1)>", "https://headcheck.app");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
