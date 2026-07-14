# Post-Crisis Follow-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a gentle, generic check-in email to a user roughly 24 hours after a crisis event, gated on their existing notification preference, with exactly one email per event and no repeats.

**Architecture:** A new nullable `followUpSentAt` timestamp column on `crisisEvents` provides dedup. A new module `server/crisisFollowUp.ts` (mirroring the existing `server/weeklyReflection.ts` cron-job pattern) queries for events past the 24h mark with no follow-up sent, sends one email per affected user via the Resend API, and marks the column. A new `GET /api/cron/crisis-follow-up` route exposes it the same way the existing `/api/cron/weekly-reflection` route does.

**Tech Stack:** Express, Drizzle ORM (MySQL), Resend API (direct `fetch`), Vitest.

## Global Constraints

- Column name: `followUpSentAt` (nullable `timestamp`) on `crisisEvents` — no other schema changes.
- Migration MUST be generated via `npx drizzle-kit generate` — never hand-write a `.sql` file or edit `drizzle/meta/_journal.json` directly.
- New file `server/crisisFollowUp.ts` exports `buildFollowUpEmailHtml` and `sendCrisisFollowUps`; mirrors the structure and error-handling style of `server/weeklyReflection.ts`.
- Email copy must never contain the words "crisis", "emergency", or "urgent" (case-insensitive) anywhere in the HTML output — this is the feature's core safety property.
- Exactly one email per user per cron run, even if that user has multiple qualifying crisis events in the same run.
- Users with `notificationsEnabled === false` never receive the email, but their qualifying events still get `followUpSentAt` set (so they are not re-queried on every future run).
- Cutoff window: `createdAt <= NOW() - 24 hours`.
- New route: `GET /api/cron/crisis-follow-up` in `server/_core/index.ts`, secured by the `x-cron-secret` header compared against `CRON_SECRET`, same contract as the existing `/api/cron/weekly-reflection` route (`sendCrisisFollowUps` throws `"Unauthorized"` on mismatch, route maps that to HTTP 401).
- `sendCrisisFollowUps` and the route itself are not unit tested (no DB in the test environment, consistent with `weeklyReflection.ts`). Only the pure `buildFollowUpEmailHtml` helper gets tests, using the same "inline a standalone copy in the test file" approach as `server/weeklyReflection.test.ts` (so the test file never imports `server/db.ts`, which the real module needs).

---

### Task 1: Schema — add `followUpSentAt` column

**Files:**
- Modify: `drizzle/schema.ts:153-164` (the `crisisEvents` table definition)
- Create: a new migration file under `drizzle/` (auto-named by `drizzle-kit generate`, e.g. `drizzle/0023_<adjective>_<name>.sql`) and an updated `drizzle/meta/_journal.json` (both generated, not hand-written)

**Interfaces:**
- Produces: `crisisEvents.followUpSentAt` — a nullable `timestamp` column, used by Task 3's query and update statements.

- [ ] **Step 1: Add the column to the schema**

Edit `drizzle/schema.ts`. The `crisisEvents` table currently ends like this (lines 153-164):

```ts
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
```

Change it to add `followUpSentAt` after `createdAt`:

```ts
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
  followUpSentAt: timestamp("followUpSentAt"),
});
```

- [ ] **Step 2: Generate the migration**

Run from the repo root (requires `DATABASE_URL` to be set — it already is in `.env`, which drizzle-kit loads automatically):

```bash
npx drizzle-kit generate
```

Expected output: a new file `drizzle/00NN_<name>.sql` (NN follows on from the highest existing number — check `ls drizzle/*.sql` first; as of this plan the last one is `0022_bouncy_charles_xavier.sql`, so this should be `0023_...`) containing an `ALTER TABLE crisis_events ADD COLUMN followUpSentAt timestamp;` statement, and `drizzle/meta/_journal.json` gains a new entry with the next `idx`.

- [ ] **Step 3: Verify the migration file and journal**

```bash
cat drizzle/00NN_*.sql   # replace NN with the actual generated number
tail -15 drizzle/meta/_journal.json
```

Confirm the SQL file contains an `ADD COLUMN followUpSentAt` statement and the journal's last entry's `idx` is one higher than before.

- [ ] **Step 4: Commit**

```bash
git add drizzle/schema.ts drizzle/00NN_*.sql drizzle/meta/_journal.json
git commit -m "Add followUpSentAt column to crisis_events"
```

---

### Task 2: Pure email template helper + tests

**Files:**
- Create: `server/crisisFollowUp.ts` (only the pure helper in this task — sender/handler come in Task 3)
- Test: `server/crisisFollowUp.test.ts`

**Interfaces:**
- Consumes: nothing (pure function, no imports from `./db`).
- Produces: `export function buildFollowUpEmailHtml(userName: string, appUrl: string): string` — consumed by Task 3's `sendCrisisFollowUpEmail`.

- [ ] **Step 1: Write the failing test file**

Create `server/crisisFollowUp.test.ts`:

```ts
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

function buildFollowUpEmailHtml(userName: string, appUrl: string): string {
  const name = userName || "there";
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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run server/crisisFollowUp.test.ts`
Expected: FAIL — `server/crisisFollowUp.test.ts` has no compile/runtime error (the helper is inlined in the test file itself), so at this point it should actually already PASS since nothing references the not-yet-created `server/crisisFollowUp.ts`. This is expected: this test file is self-contained by design. Skip ahead — there is no red step here because the test doesn't import the real module. Proceed directly to Step 3 to create the real module with matching behavior.

- [ ] **Step 3: Create `server/crisisFollowUp.ts` with the real (exported) helper**

Create `server/crisisFollowUp.ts`:

```ts
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

export function buildFollowUpEmailHtml(userName: string, appUrl: string): string {
  const name = userName || "there";
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
```

- [ ] **Step 4: Run the test suite to confirm it still passes**

Run: `npx vitest run server/crisisFollowUp.test.ts`
Expected: PASS, 6/6 tests.

- [ ] **Step 5: Commit**

```bash
git add server/crisisFollowUp.ts server/crisisFollowUp.test.ts
git commit -m "Add post-crisis follow-up email template"
```

---

### Task 3: Email sender + main orchestration handler

**Files:**
- Modify: `server/crisisFollowUp.ts` (append to the file created in Task 2)

**Interfaces:**
- Consumes: `buildFollowUpEmailHtml(userName: string, appUrl: string): string` (Task 2, same file), `getDb` from `./db`, `crisisEvents` and `users` from `../drizzle/schema`, `followUpSentAt` column (Task 1).
- Produces: `export async function sendCrisisFollowUps(appUrl: string, secret?: string): Promise<{ sent: number; skipped: number; errors: number }>` — consumed by Task 4's cron route.

- [ ] **Step 1: Add imports and the email sender to `server/crisisFollowUp.ts`**

Add these imports at the top of `server/crisisFollowUp.ts` (after the existing module doc comment, before the `RESEND_API_KEY` constant):

```ts
import { getDb } from "./db";
import { crisisEvents, users } from "../drizzle/schema";
import { and, eq, isNull, lte, inArray } from "drizzle-orm";
```

Append this section after `buildFollowUpEmailHtml`:

```ts
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
```

- [ ] **Step 2: Add the main handler**

Append this section after the email sender:

```ts
// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function sendCrisisFollowUps(
  appUrl: string,
  secret?: string
): Promise<{ sent: number; skipped: number; errors: number }> {
  if (CRON_SECRET && secret !== CRON_SECRET) {
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

  for (const [, userEvents] of eventsByUser) {
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
```

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: no new TypeScript errors introduced by `server/crisisFollowUp.ts`.

- [ ] **Step 4: Re-run the existing test file to confirm no regression**

Run: `npx vitest run server/crisisFollowUp.test.ts`
Expected: PASS, 6/6 tests (this task did not touch `buildFollowUpEmailHtml`, so behavior is unchanged).

- [ ] **Step 5: Commit**

```bash
git add server/crisisFollowUp.ts
git commit -m "Add crisis follow-up sender and cron handler"
```

---

### Task 4: Cron route

**Files:**
- Modify: `server/_core/index.ts`

**Interfaces:**
- Consumes: `sendCrisisFollowUps(appUrl: string, secret?: string): Promise<{ sent: number; skipped: number; errors: number }>` (Task 3).

- [ ] **Step 1: Import the handler**

In `server/_core/index.ts`, find this existing import (near the top, alongside the other route/handler imports):

```ts
import { sendWeeklyReflections } from "../weeklyReflection";
```

Add a new import directly after it:

```ts
import { sendWeeklyReflections } from "../weeklyReflection";
import { sendCrisisFollowUps } from "../crisisFollowUp";
```

- [ ] **Step 2: Add the route**

Find the existing weekly-reflection route (it ends with the closing `});` right before the `// tRPC API` comment):

```ts
  // ─── Cron Routes ─────────────────────────────────────────────────────────────
  // GET /api/cron/weekly-reflection — triggered every Monday at 9:00 AM UTC
  app.get("/api/cron/weekly-reflection", async (req: import("express").Request, res: import("express").Response) => {
    const secret = req.headers["x-cron-secret"] as string | undefined;
    const appUrl = req.headers.origin as string || `${req.protocol}://${req.get("host")}`;
    try {
      const result = await sendWeeklyReflections(appUrl, secret);
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Unauthorized") {
        res.status(401).json({ ok: false, error: "Unauthorized" });
      } else {
        console.error("[WeeklyReflection] Error:", err);
        res.status(500).json({ ok: false, error: message });
      }
    }
  });

  // tRPC API
```

Add the new route immediately after the weekly-reflection route and before the `// tRPC API` comment:

```ts
  // ─── Cron Routes ─────────────────────────────────────────────────────────────
  // GET /api/cron/weekly-reflection — triggered every Monday at 9:00 AM UTC
  app.get("/api/cron/weekly-reflection", async (req: import("express").Request, res: import("express").Response) => {
    const secret = req.headers["x-cron-secret"] as string | undefined;
    const appUrl = req.headers.origin as string || `${req.protocol}://${req.get("host")}`;
    try {
      const result = await sendWeeklyReflections(appUrl, secret);
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Unauthorized") {
        res.status(401).json({ ok: false, error: "Unauthorized" });
      } else {
        console.error("[WeeklyReflection] Error:", err);
        res.status(500).json({ ok: false, error: message });
      }
    }
  });

  // GET /api/cron/crisis-follow-up — polled hourly
  app.get("/api/cron/crisis-follow-up", async (req: import("express").Request, res: import("express").Response) => {
    const secret = req.headers["x-cron-secret"] as string | undefined;
    const appUrl = req.headers.origin as string || `${req.protocol}://${req.get("host")}`;
    try {
      const result = await sendCrisisFollowUps(appUrl, secret);
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Unauthorized") {
        res.status(401).json({ ok: false, error: "Unauthorized" });
      } else {
        console.error("[CrisisFollowUp] Error:", err);
        res.status(500).json({ ok: false, error: message });
      }
    }
  });

  // tRPC API
```

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: no new TypeScript errors.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all existing tests plus the 6 new `crisisFollowUp.test.ts` tests pass, no regressions.

- [ ] **Step 5: Commit**

```bash
git add server/_core/index.ts
git commit -m "Register crisis follow-up cron route"
```
