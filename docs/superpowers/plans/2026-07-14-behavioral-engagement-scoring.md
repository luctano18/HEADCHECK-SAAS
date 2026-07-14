# Behavioral Engagement Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture implicit engagement signals (dwell time, continue-vs-exit) on the check-in AI response screen, combine them with the existing explicit feedback rating into a stored `combinedScore` on `ai_responses`.

**Architecture:** Three new nullable columns on `ai_responses`. A pure scoring function combines the existing `feedbackRating` with a client-computed `behaviorScore`. A new `checkIns.reportEngagement` mutation persists it. The client computes `behaviorScore` itself (it has the only accurate view of dwell time and which exit path was taken) and ships it via `navigator.sendBeacon` so reporting never blocks navigation or fails a user-facing action.

**Tech Stack:** Drizzle ORM (MySQL), tRPC v11, React 19, `navigator.sendBeacon`, Vitest.

## Global Constraints

- Full suite (`pnpm test`) must stay green at every commit.
- `pnpm check` must report 0 TypeScript errors at every commit.
- No new frontend test infrastructure — `vitest.config.ts` only includes `server/**/*.test.ts`; client-side changes are verified by type-check + manual review, not new test files.
- Schema changes go through `drizzle-kit generate` so `drizzle/meta/_journal.json` stays correctly registered — hand-writing migration `.sql` files directly caused a real bug fixed earlier on this branch (4 migrations were silently skipped because they were never added to the journal).
- Telemetry (the engagement report) must never throw in a way a user would see, and must never block navigation. Every layer (client beacon, server mutation, DB write) is best-effort.

---

### Task 1: Add engagement columns to `ai_responses`

**Files:**
- Modify: `drizzle/schema.ts:127-145` (the `aiResponses` table)
- Create: a new `drizzle/NNNN_<generated-name>.sql`, `drizzle/meta/NNNN_snapshot.json`, and an updated `drizzle/meta/_journal.json` — all produced by `drizzle-kit generate`, not hand-written

**Interfaces:**
- Produces: `ai_responses.dwellTimeMs` (nullable int), `ai_responses.behaviorScore` (nullable int), `ai_responses.combinedScore` (nullable int) — Task 3 writes these, Task 4 exposes them via the mutation input/output shape.

- [ ] **Step 1: Add the three columns to the schema**

In `drizzle/schema.ts`, find the `aiResponses` table definition (currently lines 127-145):

```ts
export const aiResponses = mysqlTable("ai_responses", {
  id: int("id").autoincrement().primaryKey(),
  checkInId: int("checkInId").notNull().unique(),
  userId: int("userId").notNull(),
  emotionalReflection: text("emotionalReflection").notNull(),
  brainInsight: text("brainInsight").notNull(),
  eiPillar: varchar("eiPillar", { length: 128 }).notNull(),
  eiPillarDescription: text("eiPillarDescription").notNull(),
  aieiProverb: text("aieiProverb").notNull(),
  aieiProverbOrigin: varchar("aieiProverbOrigin", { length: 128 }),
  aieiProverbExplanation: text("aieiProverbExplanation"),
  personalizedNextStep: text("personalizedNextStep").notNull(),
  supportInvitation: text("supportInvitation").notNull(),
  affirmation: text("mochaAffirmation"),
  patternInsight: text("patternInsight"),
  feedbackRating: mysqlEnum("feedbackRating", ["helpful", "not_helpful", "yes", "somewhat", "not_yet"]),
  feedbackText: text("feedbackText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

Add three columns right after `feedbackText`:

```ts
export const aiResponses = mysqlTable("ai_responses", {
  id: int("id").autoincrement().primaryKey(),
  checkInId: int("checkInId").notNull().unique(),
  userId: int("userId").notNull(),
  emotionalReflection: text("emotionalReflection").notNull(),
  brainInsight: text("brainInsight").notNull(),
  eiPillar: varchar("eiPillar", { length: 128 }).notNull(),
  eiPillarDescription: text("eiPillarDescription").notNull(),
  aieiProverb: text("aieiProverb").notNull(),
  aieiProverbOrigin: varchar("aieiProverbOrigin", { length: 128 }),
  aieiProverbExplanation: text("aieiProverbExplanation"),
  personalizedNextStep: text("personalizedNextStep").notNull(),
  supportInvitation: text("supportInvitation").notNull(),
  affirmation: text("mochaAffirmation"),
  patternInsight: text("patternInsight"),
  feedbackRating: mysqlEnum("feedbackRating", ["helpful", "not_helpful", "yes", "somewhat", "not_yet"]),
  feedbackText: text("feedbackText"),
  dwellTimeMs: int("dwellTimeMs"),
  behaviorScore: int("behaviorScore"),
  combinedScore: int("combinedScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

- [ ] **Step 2: Ensure a `DATABASE_URL` is available**

`drizzle.config.ts` requires `DATABASE_URL` to be set to even read the config (it throws otherwise), but `drizzle-kit generate` itself only diffs `schema.ts` against the last local snapshot in `drizzle/meta/` — it does not need a live, reachable database.

Check: `cat .env 2>/dev/null | grep DATABASE_URL`

If nothing prints (no `.env` file, or no `DATABASE_URL` line), create/append one — any well-formed MySQL connection string works, it will not actually be connected to for this command:

```bash
echo 'DATABASE_URL="mysql://root:x@127.0.0.1:3306/headcheck"' >> .env
```

(`.env` is gitignored — this is safe to add and does not need to be removed afterward, but don't commit it.)

- [ ] **Step 3: Generate the migration**

Run: `npx drizzle-kit generate`
Expected: output ending with a line like `[✓] Your SQL migration file ➜ drizzle\NNNN_<name>.sql 🚀` — note the exact filename printed, you'll need it in Step 4.

- [ ] **Step 4: Verify the generated SQL**

Run: `cat drizzle/NNNN_<name>.sql` (using the exact filename from Step 3's output)
Expected: exactly three `ALTER TABLE \`ai_responses\` ADD \`...\`` statements, one each for `dwellTimeMs`, `behaviorScore`, `combinedScore`, each `int`. No other tables or columns should appear in this file — if they do, `schema.ts` has uncommitted drift from something else; stop and report it rather than committing an unrelated change.

- [ ] **Step 5: Type-check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add drizzle/schema.ts drizzle/*.sql drizzle/meta/_journal.json drizzle/meta/*_snapshot.json
git commit -m "Add dwellTimeMs, behaviorScore, combinedScore columns to ai_responses"
```

(The `drizzle/meta/*_snapshot.json` glob will only pick up the newly-generated snapshot file since older ones are already tracked and unchanged — `git add` on an unchanged tracked file is a no-op.)

---

### Task 2: Pure combined-score function with unit tests

**Files:**
- Modify: `server/db.ts` (add the function; exact insertion point in Step 3 below)
- Test: `server/aiResponseEngagement.test.ts` (new file)

**Interfaces:**
- Consumes: nothing new (pure function, no dependencies beyond its own inputs).
- Produces: `computeCombinedEngagementScore(feedbackRating: string | null, behaviorScore: number): number`, exported from `server/db.ts`. Task 3 consumes this.

This mirrors the `computeChallengeProgress` pattern from the earlier gamification work: pull the one piece of pure logic out so it's actually unit-testable, since `server/db.ts`'s DB-touching functions have no test coverage in this repo (no DB available in the test environment).

- [ ] **Step 1: Write the failing test**

Create `server/aiResponseEngagement.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeCombinedEngagementScore } from "./db";

describe("computeCombinedEngagementScore", () => {
  it("scores 'yes' feedback as 5 plus the behavior score", () => {
    expect(computeCombinedEngagementScore("yes", 2)).toBe(7);
  });

  it("scores 'helpful' feedback the same as 'yes'", () => {
    expect(computeCombinedEngagementScore("helpful", 0)).toBe(5);
  });

  it("scores 'somewhat' feedback as 3 plus the behavior score", () => {
    expect(computeCombinedEngagementScore("somewhat", 1)).toBe(4);
  });

  it("scores 'not_yet' feedback as 1 plus the behavior score", () => {
    expect(computeCombinedEngagementScore("not_yet", -2)).toBe(-1);
  });

  it("scores 'not_helpful' feedback the same as 'not_yet'", () => {
    expect(computeCombinedEngagementScore("not_helpful", 2)).toBe(3);
  });

  it("treats no feedback (null) as contributing 0", () => {
    expect(computeCombinedEngagementScore(null, -2)).toBe(-2);
    expect(computeCombinedEngagementScore(null, 2)).toBe(2);
  });

  it("treats an unrecognized rating string as contributing 0", () => {
    expect(computeCombinedEngagementScore("unexpected_value", 1)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run server/aiResponseEngagement.test.ts`
Expected: FAIL — `computeCombinedEngagementScore` is not exported from `./db`.

- [ ] **Step 3: Add the function to server/db.ts**

In `server/db.ts`, immediately above the existing `export async function updateAiResponseFeedback` (currently at line 259), add:

```ts
const ENGAGEMENT_RATING_SCORE: Record<string, number> = {
  yes: 5,
  helpful: 5,
  somewhat: 3,
  not_yet: 1,
  not_helpful: 1,
};

/** Pure — combines the stored explicit feedback rating with a client-reported behavior score. */
export function computeCombinedEngagementScore(
  feedbackRating: string | null,
  behaviorScore: number
): number {
  const explicit = feedbackRating ? (ENGAGEMENT_RATING_SCORE[feedbackRating] ?? 0) : 0;
  return explicit + behaviorScore;
}

```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run server/aiResponseEngagement.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add server/db.ts server/aiResponseEngagement.test.ts
git commit -m "Add computeCombinedEngagementScore pure helper with unit tests"
```

---

### Task 3: DB write function `recordAiResponseEngagement`

**Files:**
- Modify: `server/db.ts` (add the function; exact insertion point in Step 1 below)

**Interfaces:**
- Consumes: `computeCombinedEngagementScore` from Task 2 (exact signature above); `aiResponses` table (already imported at the top of `server/db.ts`); `and`, `eq` from `drizzle-orm` (already imported at the top of `server/db.ts`).
- Produces: `recordAiResponseEngagement(checkInId: number, userId: number, dwellTimeMs: number, behaviorScore: number): Promise<void>`, exported from `server/db.ts`. Task 4 consumes this.

No new automated test — this function requires a live DB connection this test environment doesn't have (same reasoning as `updateWeeklyChallengeProgress` from the earlier gamification work). Verified by type-check and the manual review in Task 6.

- [ ] **Step 1: Add the function**

In `server/db.ts`, immediately after the `computeCombinedEngagementScore` function added in Task 2 (and still above `updateAiResponseFeedback`), add:

```ts
/**
 * Best-effort: records implicit engagement signals for an AI response and
 * recomputes its combined score. No-ops silently if the DB is unavailable
 * or the check-in doesn't belong to this user — this is telemetry, never
 * something a user-facing action should fail over.
 */
export async function recordAiResponseEngagement(
  checkInId: number,
  userId: number,
  dwellTimeMs: number,
  behaviorScore: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select({ feedbackRating: aiResponses.feedbackRating })
    .from(aiResponses)
    .where(and(eq(aiResponses.checkInId, checkInId), eq(aiResponses.userId, userId)))
    .limit(1);
  if (!existing[0]) return;

  const combinedScore = computeCombinedEngagementScore(existing[0].feedbackRating, behaviorScore);

  await db
    .update(aiResponses)
    .set({ dwellTimeMs, behaviorScore, combinedScore })
    .where(and(eq(aiResponses.checkInId, checkInId), eq(aiResponses.userId, userId)));
}

```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: all existing tests still pass (162 passed before this task: 150 pre-existing + 5 from the earlier gamification work's `weeklyChallenges.test.ts` + 7 from Task 2's `aiResponseEngagement.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add server/db.ts
git commit -m "Add recordAiResponseEngagement DB write function"
```

---

### Task 4: `checkIns.reportEngagement` router mutation

**Files:**
- Modify: `server/routers.ts` (two edits: an import addition, and a new procedure)

**Interfaces:**
- Consumes: `recordAiResponseEngagement` from Task 3 (exact signature above).
- Produces: `checkIns.reportEngagement` tRPC mutation, input `{ checkInId: number; dwellTimeMs: number; behaviorScore: number }`, output `{ success: true }`. Task 5 (client) calls this via a raw `sendBeacon` POST to `/api/trpc/checkIns.reportEngagement?batch=1` (not through the tRPC client — see Task 5's rationale).

- [ ] **Step 1: Import `recordAiResponseEngagement`**

In `server/routers.ts`, find the line (currently line 91, inside a larger destructured import from `"./db"`):

```ts
  updateAiResponseFeedback,
```

Change it to:

```ts
  updateAiResponseFeedback,
  recordAiResponseEngagement,
```

- [ ] **Step 2: Add the mutation**

In `server/routers.ts`, inside the `checkIns` router, find the existing `submitFeedback` procedure (currently lines 855-868):

```ts
    submitFeedback: protectedProcedure
      .input(z.object({
        checkInId: z.number(),
        rating: z.enum(["helpful", "not_helpful", "yes", "somewhat", "not_yet"]),
        feedbackText: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateAiResponseFeedback(
          input.checkInId,
          ctx.user.id,
          input.rating,
          input.feedbackText
        );
        return { success: true };
      }),
```

Add a new procedure directly after it (still inside the `checkIns` router):

```ts
    submitFeedback: protectedProcedure
      .input(z.object({
        checkInId: z.number(),
        rating: z.enum(["helpful", "not_helpful", "yes", "somewhat", "not_yet"]),
        feedbackText: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateAiResponseFeedback(
          input.checkInId,
          ctx.user.id,
          input.rating,
          input.feedbackText
        );
        return { success: true };
      }),

    reportEngagement: protectedProcedure
      .input(z.object({
        checkInId: z.number(),
        dwellTimeMs: z.number().min(0),
        behaviorScore: z.number().min(-2).max(2),
      }))
      .mutation(async ({ ctx, input }) => {
        await recordAiResponseEngagement(input.checkInId, ctx.user.id, input.dwellTimeMs, input.behaviorScore);
        return { success: true };
      }),
```

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: all tests still pass (162 total — this task adds no new tests).

- [ ] **Step 5: Commit**

```bash
git add server/routers.ts
git commit -m "Add checkIns.reportEngagement mutation"
```

---

### Task 5: Client-side engagement tracking on the check-in result screen

**Files:**
- Modify: `client/src/pages/CheckInResult.tsx`

**Interfaces:**
- Consumes: the `checkIns.reportEngagement` mutation from Task 4, called via a raw `fetch`-free `navigator.sendBeacon` POST (not `trpc.checkIns.reportEngagement.useMutation()`) — `sendBeacon` is fire-and-forget by design and survives the page unloading, which a normal `fetch`/mutation call does not reliably do when the tab is closing.
- Produces: nothing consumed elsewhere — this is a leaf, UI-only change.

- [ ] **Step 1: Add `useRef` and `useEffect` to the React import**

In `client/src/pages/CheckInResult.tsx`, change (currently line 1):

```tsx
import { useAuth } from "@/_core/hooks/useAuth";
```

Find the very first import line in the file:

```tsx
import { useAuth } from "@/_core/hooks/useAuth";
```

Add a new import above it:

```tsx
import { useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
```

- [ ] **Step 2: Add the beacon sender and scoring helpers**

In `client/src/pages/CheckInResult.tsx`, find the end of the `RESPONSE_SECTIONS` array (currently lines 16-24, ending with `];`) and the comment starting the Feedback Bar section (currently line 26 `// ─── Feedback Bar ─────...`). Insert between them:

```ts
// ─── Engagement Beacon ──────────────────────────────────────────────────────
function sendEngagementBeacon(checkInId: number, dwellTimeMs: number, behaviorScore: number) {
  const body = JSON.stringify({ "0": { json: { checkInId, dwellTimeMs, behaviorScore } } });
  navigator.sendBeacon(
    "/api/trpc/checkIns.reportEngagement?batch=1",
    new Blob([body], { type: "application/json" })
  );
}

/** Score for a deliberate "continue the journey" action (New Check-In / Self Trust Compass). */
function scoreOnContinue(dwellMs: number, feedbackGiven: boolean): number {
  if (dwellMs > 8000) return 2;
  return feedbackGiven ? 1 : 0;
}

/** Score for a passive exit (SPA unmount via other navigation, or the tab closing). */
function scoreOnExit(dwellMs: number, feedbackGiven: boolean): number {
  if (dwellMs < 3000 && !feedbackGiven) return -2;
  return feedbackGiven ? 1 : 0;
}

```

- [ ] **Step 3: Wire `FeedbackBar` to report when feedback is given**

In `client/src/pages/CheckInResult.tsx`, change the `FeedbackBar` function signature and its mutation's `onSuccess` (currently lines 27-38):

```tsx
function FeedbackBar({ checkInId }: { checkInId: number }) {
  const [selected, setSelected] = useState<"yes" | "somewhat" | "not_yet" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.checkIns.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
    },
    onError: () => toast.error("Could not save feedback. Please try again."),
  });
```

to:

```tsx
function FeedbackBar({ checkInId, onFeedbackGiven }: { checkInId: number; onFeedbackGiven: () => void }) {
  const [selected, setSelected] = useState<"yes" | "somewhat" | "not_yet" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.checkIns.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onFeedbackGiven();
      toast.success("Thank you for your feedback!");
    },
    onError: () => toast.error("Could not save feedback. Please try again."),
  });
```

- [ ] **Step 4: Add tracking refs and effect to the main component**

In `client/src/pages/CheckInResult.tsx`, find (currently lines 111-120):

```tsx
export default function CheckInResult() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const checkInId = parseInt(params.id ?? "0");

  const { data, isLoading, error } = trpc.checkIns.getWithResponse.useQuery(
    { checkInId },
    { enabled: !!checkInId && isAuthenticated }
  );

  if (!isAuthenticated) { navigate("/"); return null; }
```

Change to:

```tsx
export default function CheckInResult() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const checkInId = parseInt(params.id ?? "0");

  const { data, isLoading, error } = trpc.checkIns.getWithResponse.useQuery(
    { checkInId },
    { enabled: !!checkInId && isAuthenticated }
  );

  const pageEnteredAtRef = useRef(performance.now());
  const feedbackGivenRef = useRef(false);
  const reportSentRef = useRef(false);

  const reportExit = () => {
    if (reportSentRef.current) return;
    reportSentRef.current = true;
    const dwellMs = performance.now() - pageEnteredAtRef.current;
    sendEngagementBeacon(checkInId, dwellMs, scoreOnExit(dwellMs, feedbackGivenRef.current));
  };

  const reportContinue = () => {
    if (reportSentRef.current) return;
    reportSentRef.current = true;
    const dwellMs = performance.now() - pageEnteredAtRef.current;
    sendEngagementBeacon(checkInId, dwellMs, scoreOnContinue(dwellMs, feedbackGivenRef.current));
  };

  useEffect(() => {
    if (!checkInId) return;
    window.addEventListener("pagehide", reportExit);
    return () => {
      window.removeEventListener("pagehide", reportExit);
      reportExit();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInId]);

  if (!isAuthenticated) { navigate("/"); return null; }
```

- [ ] **Step 5: Pass the callback into `FeedbackBar`**

In `client/src/pages/CheckInResult.tsx`, change (currently line 261):

```tsx
        {aiResponse && <FeedbackBar checkInId={checkInId} />}
```

to:

```tsx
        {aiResponse && <FeedbackBar checkInId={checkInId} onFeedbackGiven={() => { feedbackGivenRef.current = true; }} />}
```

- [ ] **Step 6: Wire the two continue buttons**

In `client/src/pages/CheckInResult.tsx`, change (currently lines 264-271):

```tsx
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button variant="outline" className="h-12" onClick={() => navigate("/checkin")}>
            <Heart className="w-4 h-4 mr-2" /> New Check-In
          </Button>
          <Button className="h-12" onClick={() => navigate("/compass")}>
            <Sparkles className="w-4 h-4 mr-2" /> Self Trust Compass
          </Button>
        </div>
```

to:

```tsx
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button variant="outline" className="h-12" onClick={() => { reportContinue(); navigate("/checkin"); }}>
            <Heart className="w-4 h-4 mr-2" /> New Check-In
          </Button>
          <Button className="h-12" onClick={() => { reportContinue(); navigate("/compass"); }}>
            <Sparkles className="w-4 h-4 mr-2" /> Self Trust Compass
          </Button>
        </div>
```

- [ ] **Step 7: Type-check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/CheckInResult.tsx
git commit -m "Track implicit engagement signals on the check-in result screen"
```

---

### Task 6: Final verification

**Files:** None (verification only).

- [ ] **Step 1: Full type-check**

Run: `pnpm check`
Expected: 0 TypeScript errors.

- [ ] **Step 2: Full test suite**

Run: `pnpm test`
Expected: all test files pass, 162 total (150 pre-existing + 5 `weeklyChallenges.test.ts` + 7 new `aiResponseEngagement.test.ts`).

- [ ] **Step 3: Manual review checklist**

Confirm by reading the diff:
- [ ] `ai_responses` has exactly three new nullable int columns: `dwellTimeMs`, `behaviorScore`, `combinedScore`.
- [ ] `drizzle/meta/_journal.json` contains a new entry for the generated migration (not just a new `.sql` file sitting unregistered — this was the exact bug fixed earlier on this branch).
- [ ] `computeCombinedEngagementScore` is pure (no `await`, no DB import used inside it) and every feedback rating value in the `ai_responses.feedbackRating` enum (`helpful`, `not_helpful`, `yes`, `somewhat`, `not_yet`) maps to a score.
- [ ] `recordAiResponseEngagement` never throws past its own function body in a way that would propagate to the router (no un-caught rejection risk — it only ever returns `undefined` or completes normally).
- [ ] `checkIns.reportEngagement`'s `behaviorScore` input is bounded `-2..2` via zod, matching what the client ever actually sends.
- [ ] `CheckInResult.tsx` sends at most one beacon per page visit — verify `reportSentRef` is checked and set in both `reportExit` and `reportContinue` before any early return in the surrounding logic could skip it.
- [ ] No `trpc.checkIns.reportEngagement.useMutation()` anywhere in `CheckInResult.tsx` — the report is sent exclusively via `sendEngagementBeacon`'s raw `sendBeacon` call, per the design (a normal mutation is not guaranteed to complete before the tab closes).

- [ ] **Step 4 (optional, only if a local `DATABASE_URL`/dev server is available): Live manual test**

Run `pnpm dev`, log in, complete a check-in, and on the result screen:
1. Wait more than 8 seconds, then click "New Check-In" — expect no visible change (this is silent telemetry), but check the server logs / DB directly (`SELECT dwellTimeMs, behaviorScore, combinedScore FROM ai_responses ORDER BY id DESC LIMIT 1;`) and expect `behaviorScore = 2`.
2. On a fresh check-in, submit feedback ("Yes") then immediately click "Self Trust Compass" — expect `behaviorScore = 1`, `combinedScore = 6` (5 for "yes" + 1).
3. On a fresh check-in, navigate away via the "Dashboard" button within 2 seconds without submitting feedback — expect `behaviorScore = -2`.

- [ ] **Step 5: Final commit (if any fixes were needed from this review)**

```bash
git add -A
git commit -m "Final verification pass for behavioral engagement scoring"
```

(Skip this commit if Steps 1-4 found nothing to fix.)
