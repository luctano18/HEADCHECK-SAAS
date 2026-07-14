# Post-Crisis Follow-Up

**Date:** 2026-07-14
**Status:** Approved

## Context

Reference documents for HeadCheck describe a post-crisis follow-up loop:
after a crisis event, the app should check back in on the user some time
later. The current codebase already detects crises (`detectCrisis` /
`detectViolence`, `crisisEvents` / `violenceFlags` tables) and notifies
facilitators/admins (`notifyAdmins` in `server/routers.ts`). It also has an
immediate, in-session reconnect card ("Stay With Me") on
`client/src/pages/CrisisSupport.tsx`. There is no delayed, automated
check-in that reaches the affected user later — this spec adds that.

## Scope

In scope:
- A scheduled email sent to the user roughly 24 hours after a crisis event,
  gentle and generic in tone (never mentions "crisis"/"emergency"
  explicitly, to stay safe if glimpsed by a third party on a lock screen or
  shared inbox).
- Gated on the user's existing `notificationsEnabled` preference — no new
  toggle.
- One email per user per cron run, even if the user has multiple recent
  crisis events.
- A new `followUpSentAt` column on `crisisEvents` for dedup, so each event
  triggers at most one follow-up.

Out of scope: push notifications (deliberately excluded — previews can
appear on lock screens, less discreet than email), a dedicated opt-out
toggle, follow-ups for `violenceFlags` (a distinct concern from personal
crisis support), any facilitator-facing view of follow-up status.

## Design

### 1. Schema change

Add one nullable column to `crisisEvents` (`drizzle/schema.ts`):

```ts
followUpSentAt: timestamp("followUpSentAt"),
```

Generated via `drizzle-kit generate` (never hand-written), so
`drizzle/meta/_journal.json` stays correctly registered.

`NULL` means no follow-up has been sent yet. Once set, the cron never
reconsiders that event again.

### 2. Business logic (`server/crisisFollowUp.ts`, new file)

Mirrors the structure of `server/weeklyReflection.ts`:

**Pure helper (unit tested):**

```ts
export function buildFollowUpEmailHtml(userName: string, appUrl: string): string
```

Builds a gentle, generic HTML email. Tone guidance: something like "We were
thinking of you. How are you doing today?" with a CTA linking to a check-in.
The copy must never contain the words "crisis," "emergency," or similar —
this is the core safety property of the feature, verified by a test.

**Email sender:**

```ts
async function sendCrisisFollowUpEmail(to: string, userName: string, appUrl: string): Promise<boolean>
```

Direct `fetch` to the Resend API (`https://api.resend.com/emails`), same
pattern as `weeklyReflection.ts` — module-level `RESEND_API_KEY` and
`FROM_EMAIL` (fallback `"HeadCheck AI <notifications@headcheck.app>"`).
Returns `true`/`false` for success, catching and logging errors rather than
throwing (best-effort, one user's failure must not abort the run).

**Main handler:**

```ts
export async function sendCrisisFollowUps(
  appUrl: string,
  secret: string | undefined
): Promise<{ sent: number; skipped: number; errors: number }>
```

Steps:
1. Validate `secret === process.env.CRON_SECRET`; throw `"Unauthorized"` if
   not (matches `weeklyReflection.ts`'s contract with the cron route).
2. Query `crisisEvents` joined to `users`, filtered to
   `followUpSentAt IS NULL AND createdAt <= NOW() - 24 hours`.
3. Group the results by `userId` (a user may have multiple qualifying
   events in one run — collapse to one email, but remember all their event
   ids for step 5).
4. For each user:
   - If `notificationsEnabled === false`: skip sending, but still mark
     `followUpSentAt = now()` on all that user's qualifying events (so they
     aren't re-queried forever), and count as `skipped`.
   - Otherwise: call `sendCrisisFollowUpEmail`. On success, mark
     `followUpSentAt = now()` on all that user's qualifying events for this
     run and count as `sent`. On failure, leave `followUpSentAt` as `NULL`
     (retried next run) and count as `errors`.
5. Return `{ sent, skipped, errors }`.

### 3. Cron route (`server/_core/index.ts`)

```ts
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
```

Same shape as the existing `/api/cron/weekly-reflection` route, secured the
same way (`x-cron-secret` header compared to `CRON_SECRET`). Recommended
polling frequency is hourly (external cron scheduler config, outside this
repo) — finer-grained than the weekly cron since this feature has a ~24h
window rather than a weekly one, but that scheduling itself is not part of
this change.

### Error Handling

- Per-user best-effort: a Resend failure for one user is caught, logged,
  and counted in `errors`; the loop continues to the next user. That user's
  events keep `followUpSentAt = NULL` and are retried on the next run.
- No retry queue, no dead-letter handling — consistent with
  `weeklyReflection.ts`'s existing error handling, which this feature
  mirrors.
- The route-level catch distinguishes `"Unauthorized"` (401) from any other
  thrown error (500), matching the existing weekly-reflection route.

### Testing

- `server/crisisFollowUp.test.ts` — unit tests for the pure
  `buildFollowUpEmailHtml` helper: includes the user's name, never contains
  "crisis," "emergency," or "urgent" (case-insensitive) anywhere in the
  output, includes an unsubscribe/preferences link, is valid HTML with a
  doctype. Same approach as `weeklyReflection.test.ts`.
- `sendCrisisFollowUps` and the cron route are not unit tested — consistent
  with this repo's convention that DB-touching functions have no test
  coverage (no DB available in the test environment).
