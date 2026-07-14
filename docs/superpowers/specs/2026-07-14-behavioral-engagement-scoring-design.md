# Behavioral Engagement Scoring — Foundation

**Date:** 2026-07-14
**Status:** Approved

## Context

Reference documents for HeadCheck (`HEADCHECK FULL SYSTEM FLOW.docx`, and the
"Check-In Scoring Engine" / "Scoring + Adjustment Loop" diagrams in
`check in section.png`) describe a scoring loop that combines a user's
explicit feedback ("Did this help?") with implicit behavioral signals
(clicking through, saving, exiting immediately) into a combined score, which
feeds an "improve response templates" loop.

The current codebase already captures explicit feedback:
`checkIns.submitFeedback` writes a `feedbackRating` (`yes` / `somewhat` /
`not_yet` / legacy `helpful` / `not_helpful`) onto the `ai_responses` row via
`updateAiResponseFeedback` (`server/db.ts:259`). There is no implicit
behavioral signal at all today.

The reference docs' "serve alternate response variations" doesn't map onto
this app's architecture — AI responses are generated live per check-in by an
LLM call (`generateAiResponse` in `server/routers.ts`), not selected from a
pre-written template bank. This iteration is scoped to the buildable,
valuable part: **capture the signals and compute the score.** Acting on low
scores (a facilitator review view, prompt tuning, etc.) is a deliberate
follow-up, not part of this spec.

## Scope

In scope:
- Track two implicit behavior signals on the check-in AI response screen
  (`client/src/pages/CheckInResult.tsx`): dwell time, and whether the user
  took a "continue the journey" action (New Check-In / Self Trust Compass)
  vs. a passive exit (navigating away another way, or closing the tab).
- Compute a `behaviorScore` (-2 to +2) from those signals.
- Combine it with the existing explicit `feedbackRating` into a
  `combinedScore`, stored alongside the raw `dwellTimeMs` and
  `behaviorScore` on the `ai_responses` row.
- A new `checkIns.reportEngagement` mutation, sent via `navigator.sendBeacon`
  so it never blocks navigation and survives tab close.

Out of scope (future iterations): Seven Mirrors' equivalent AI summary
screen, any admin/facilitator view of low-scoring responses, any automated
action taken on the score (prompt tuning, response variation selection).

## Design

### 1. Schema changes

Add three nullable columns to `ai_responses` (`drizzle/schema.ts`):

```ts
dwellTimeMs: int("dwellTimeMs"),
behaviorScore: int("behaviorScore"),
combinedScore: int("combinedScore"),
```

Generated via `drizzle-kit generate` (not hand-written), so
`drizzle/meta/_journal.json` stays correctly registered — the exact bug
fixed earlier this branch.

### 2. Pure scoring function (`server/db.ts`)

```ts
const ENGAGEMENT_RATING_SCORE: Record<string, number> = {
  yes: 5,
  helpful: 5,
  somewhat: 3,
  not_yet: 1,
  not_helpful: 1,
};

export function computeCombinedEngagementScore(
  feedbackRating: string | null,
  behaviorScore: number
): number {
  const explicit = feedbackRating ? (ENGAGEMENT_RATING_SCORE[feedbackRating] ?? 0) : 0;
  return explicit + behaviorScore;
}
```

`behaviorScore` is trusted as sent by the client (validated to the -2..+2
range by the router's zod schema) — the server does not re-derive it from
raw timing, since the client is the only side that has accurate `dwellTimeMs`
and the exact exit path taken.

### 3. DB write (`server/db.ts`)

```ts
export async function recordAiResponseEngagement(
  checkInId: number,
  userId: number,
  dwellTimeMs: number,
  behaviorScore: number
) {
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

No-ops silently when the DB is unavailable or the row doesn't belong to the
calling user — this is best-effort telemetry, never something a user-facing
action should fail over.

### 4. Router (`server/routers.ts`, inside `checkIns` router)

```ts
reportEngagement: protectedProcedure
  .input(z.object({
    checkInId: z.number(),
    dwellTimeMs: z.number().min(0),
    behaviorScore: z.number().min(-2).max(2),
  }))
  .mutation(async ({ ctx, input }) => {
    await recordAiResponseEngagement(ctx.user.id, input.checkInId, input.dwellTimeMs, input.behaviorScore);
    return { success: true };
  }),
```

### 5. Client tracking (`client/src/pages/CheckInResult.tsx`)

State (component-level refs, not React state — none of this should trigger
re-renders):
- `pageEnteredAtRef = useRef(performance.now())`
- `feedbackGivenRef = useRef(false)` — flipped to `true` by a callback passed
  into `FeedbackBar`, invoked from its existing `onSuccess` handler
- `reportSentRef = useRef(false)` — guards against sending twice when both a
  button click and unmount/pagehide fire

Beacon sender (matches the tRPC batch-link request shape already verified
working against this server's Express adapter):

```ts
function sendEngagementBeacon(checkInId: number, dwellTimeMs: number, behaviorScore: number) {
  const body = JSON.stringify({ "0": { json: { checkInId, dwellTimeMs, behaviorScore } } });
  navigator.sendBeacon(
    "/api/trpc/checkIns.reportEngagement?batch=1",
    new Blob([body], { type: "application/json" })
  );
}
```

Two call sites, each with its own score formula (matching the design
approved above — "continue" actions can only score 0/+1/+2, passive exits
can only score -2/+1/0):

- **"New Check-In" / "Self Trust Compass" button `onClick`** (before
  `navigate(...)`): `dwellMs > 8000 ? 2 : feedbackGivenRef.current ? 1 : 0`
- **`useEffect` cleanup (SPA unmount) and a `pagehide` listener** (real tab
  close/refresh — React's unmount does not fire in that case, so both paths
  are needed): `dwellMs < 3000 && !feedbackGivenRef.current ? -2 : feedbackGivenRef.current ? 1 : 0`

Both paths check `reportSentRef.current` first and set it before sending, so
only one report is ever recorded per page visit.

### Error Handling

- `sendBeacon` itself returns a boolean (queued or not) with no error
  callback — nothing to catch. If it returns `false` (payload too large /
  browser refused), we simply lose that one telemetry point; not retried.
- Server-side: covered above (silent no-op on missing DB or ownership
  mismatch). The mutation never throws in a way the client would see, since
  the client never awaits it (`sendBeacon` is fire-and-forget).

### Testing

- `computeCombinedEngagementScore` gets a unit test file
  (`server/aiResponseEngagement.test.ts`) covering: each feedback rating
  value combined with a behavior score, `null` rating (no feedback yet), and
  boundary behavior scores (-2 and +2).
- `recordAiResponseEngagement` and the router mutation are not unit tested,
  consistent with this repo's existing convention (DB-touching functions
  have no test coverage since there's no DB available in the test
  environment — see `server/weeklyChallenges.test.ts` from the earlier
  gamification work for the same reasoning).
- No frontend test infra exists in this repo (`vitest.config.ts` only
  includes `server/**/*.test.ts`); the client-side beacon logic is verified
  by manual testing during implementation, not a new test file.
