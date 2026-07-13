# Gamification: Fix Wiring + Immediate Reward Feedback

**Date:** 2026-07-13
**Status:** Approved

## Context

HeadCheck AI recently gained a gamification layer: user levels/XP (`userLevels` table,
`server/db.ts#addUserXp`/`getUserLevel`) and weekly challenges (`weeklyChallenges` table,
`server/db.ts#getOrCreateWeeklyChallenges`/`updateWeeklyChallengeProgress`), surfaced via
`LevelProgress.tsx` and `WeeklyChallenges.tsx` on the Dashboard.

Auditing the existing code turned up three concrete problems:

1. **Wrong trigger for the "Complete the Compass" challenge.** It's meant to reward finishing
   the Seven Mirrors / Self Trust Compass journey, but `checkIns.create` (server/routers.ts)
   increments it whenever a check-in's `context === "Self"` — unrelated to actually completing
   the journey. Meanwhile `sevenMirrors.submitMirrorResponse`, which handles real completion
   (`isLast` mirror index 6), never touches XP or challenge progress at all.
2. **No reward feedback in the UI.** `addUserXp` returns `leveledUp`, and
   `updateUserStreak` returns `newAchievements`, but nothing in the client reads or displays
   these. Users only discover a level-up or new badge by revisiting the Dashboard later —
   the mechanic has no moment-of-reward, which undercuts the point of gamification.
3. **Language leak.** `LevelProgress.tsx` renders French strings ("Niveau", "jusqu'au niveau
   {n}", "% vers le niveau suivant") while the rest of the product, including the adjacent
   `WeeklyChallenges.tsx`, is American English.

## Scope

In scope:
- Fix `compass_complete` to trigger on real Seven Mirrors completion, not check-in context.
- Make `updateWeeklyChallengeProgress` return enough data for callers to know a challenge
  was just completed (and whether that pushed a level-up).
- Surface level-up, challenge-completed, and new-badge moments as toasts in the three flows
  that can trigger them: check-in, EI quiz, Seven Mirrors.
- Translate `LevelProgress.tsx` strings to English.

Out of scope (future iteration): weekly challenge rotation/variety, a more ceremonious
level-up modal, redesigning the Dashboard gamification cards.

## Design

### 1. `updateWeeklyChallengeProgress` return value

Currently `void`. Change to return:

```ts
type ChallengeProgressResult = {
  completed: boolean;
  title: string;
  xpReward: number;
  leveledUp: boolean;
  newLevel: number;
} | null;
```

`null` when there's no DB connection, the challenge row doesn't exist for the current
week, or it was already completed before this call (no new event to report — avoids
re-toasting on repeated actions). When `completed` flips false→true on this call, it also
awards XP via the existing internal `addUserXp` call and folds that result's `leveledUp`/
`level` into the return value.

### 2. Seven Mirrors completion wiring

In `sevenMirrors.submitMirrorResponse`, when `isLast` is true (mirror index 6), after
`completeSevenMirrorsSession`, call:

```ts
const challengeResult = await updateWeeklyChallengeProgress(ctx.user.id, "compass_complete", 1);
```

Include `challengeResult` in the mutation's return payload alongside `completed`,
`summary`, `badges`.

Remove the `if (input.context === "Self") { await updateWeeklyChallengeProgress(...) }`
block from `checkIns.create` in server/routers.ts — it was the incorrect trigger.

### 3. Response payload additions

- `checkIns.create`: already returns `streak: streakData` (with `leveledUp`,
  `newAchievements`). No structural change needed here, only the client needs to read it.
- `quiz.submit`: capture the return of its existing
  `updateWeeklyChallengeProgress(ctx.user.id, "ei_quiz", 1)` call and include it in the
  response as `challengeResult`.
- `sevenMirrors.submitMirrorResponse`: include `challengeResult` as above (only present
  when `isLast`).

### 4. Client-side toasts

Using the existing `sonner` `toast` (already imported in all three pages), after a
successful mutation:

- Level up (`leveledUp === true`, from either `streak` or `challengeResult`):
  `toast.success(\`🎉 Level up! You're now Level ${level}\`)`
- Challenge completed (`challengeResult?.completed === true`):
  `toast.success(\`🏆 Challenge completed: ${title} (+${xpReward} XP)\`)`
- New badge (`streak.newAchievements`, array of `"emoji title"` strings, check-in flow
  only): one `toast.success(entry)` per new achievement.

If more than one of these fires from the same action (e.g. a check-in completes a
challenge AND levels up), stagger them with a short delay (~600ms apart) so they're
readable instead of stacking instantly.

Wiring points:
- `client/src/pages/CheckIn.tsx`, right after `const result = await createCheckIn.mutateAsync(payload)` (~line 225).
- `client/src/pages/EIQuiz.tsx`, right after `result = await submitAuth.mutateAsync({ answers })` (~line 106).
- `client/src/pages/SevenMirrors.tsx`, in the completion branch of the submit-mirror-response handler.

Guest flows (`guestCreate`, `guestSubmit`) never award XP/challenges server-side, so no
toast wiring needed there.

### 5. Language fix

`client/src/components/LevelProgress.tsx`:
- "Niveau" → "Level"
- "jusqu'au niveau {level + 1}" → "to level {level + 1}"
- "{progress}% vers le niveau suivant" → "{progress}% to next level"

## Error Handling

- `updateWeeklyChallengeProgress` returning `null` is a normal, expected case (not an
  error) — callers just skip the toast.
- Toast wiring is purely additive UI feedback; if a mutation's response is missing the
  new fields (shouldn't happen post-change, but defensively), the toast logic no-ops
  rather than throwing.

## Testing

- Update/extend `server/interventionEngine.test.ts`-adjacent unit tests: add coverage in
  a relevant test file for `updateWeeklyChallengeProgress`'s new return shape (completed
  vs. not-yet-completed vs. already-completed cases).
- Add a unit test asserting `sevenMirrors.submitMirrorResponse` on the 7th mirror triggers
  `compass_complete` progress, and that a plain check-in with `context === "Self"` no
  longer does.
- No new frontend test infra exists in this repo (vitest covers server/ only per
  `vitest.config.ts`) — client toast wiring is verified manually (see plan's manual
  verification step) rather than via new frontend tests.
- Full suite (`pnpm test`) must stay green; `pnpm check` must stay at 0 TypeScript errors.
