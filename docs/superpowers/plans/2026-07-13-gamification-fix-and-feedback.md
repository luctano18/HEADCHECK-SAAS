# Gamification Fix + Reward Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mis-wired "Complete the Compass" weekly challenge, surface level-up/challenge/badge moments as toasts across check-in, EI quiz, and Seven Mirrors, and remove the French strings leaking into `LevelProgress.tsx`.

**Architecture:** `server/db.ts` gains a pure, unit-tested helper (`computeChallengeProgress`) that `updateWeeklyChallengeProgress` and `updateUserStreak` use to compute and now *return* completion/level-up data (previously discarded). `server/routers.ts` threads that data into the `checkIns.create`, `sevenMirrors.submitMirrorResponse`, and `quiz.submit` tRPC responses, and fixes `compass_complete` to trigger on real Seven Mirrors completion instead of check-in context. Three client pages read the new response fields and fire `sonner` toasts.

**Tech Stack:** TypeScript, tRPC v11, Drizzle ORM (MySQL), React 19, `sonner` (toast), Vitest.

## Global Constraints

- Full suite (`pnpm test`) must stay green at every commit.
- `pnpm check` must report 0 TypeScript errors at every commit.
- No new frontend test infrastructure — this repo's `vitest.config.ts` only includes `server/**/*.test.ts`; client-side changes are verified by type-check + manual review, not new test files.
- All new/changed user-facing strings must be American English (no French) — this whole effort is partly in response to a French-string leak already found in `LevelProgress.tsx`.
- Toast copy uses `sonner`'s `toast.success(...)`, matching the library already used in every touched file.

---

### Task 1: Extract and test `computeChallengeProgress`

**Files:**
- Modify: `server/db.ts:1978-1980` (insert new function before `getOrCreateWeeklyChallenges`)
- Test: `server/weeklyChallenges.test.ts` (new file)

**Interfaces:**
- Produces: `computeChallengeProgress(current: { progress: number; target: number; completed: boolean }, increment: number): { newProgress: number; isCompleted: boolean } | null`, exported from `server/db.ts`. Task 2 consumes this.

This is the only piece of the challenge-progress logic that's pure (no DB I/O), so it's the only part we can meaningfully unit-test without a live database — this repo's other DB-touching functions in `db.ts` have no unit tests for the same reason (see `moodTrend.test.ts`, which only tests the pure aggregation helpers, not the DB-reading functions around them).

- [ ] **Step 1: Write the failing test**

Create `server/weeklyChallenges.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeChallengeProgress } from "./db";

describe("computeChallengeProgress", () => {
  it("returns null when the challenge is already completed", () => {
    const result = computeChallengeProgress({ progress: 5, target: 5, completed: true }, 1);
    expect(result).toBeNull();
  });

  it("increments progress without completing when below target", () => {
    const result = computeChallengeProgress({ progress: 1, target: 5, completed: false }, 1);
    expect(result).toEqual({ newProgress: 2, isCompleted: false });
  });

  it("marks completed when progress reaches the target exactly", () => {
    const result = computeChallengeProgress({ progress: 4, target: 5, completed: false }, 1);
    expect(result).toEqual({ newProgress: 5, isCompleted: true });
  });

  it("caps progress at target when increment overshoots", () => {
    const result = computeChallengeProgress({ progress: 4, target: 5, completed: false }, 10);
    expect(result).toEqual({ newProgress: 5, isCompleted: true });
  });

  it("marks completed when target was already met before this call", () => {
    const result = computeChallengeProgress({ progress: 5, target: 5, completed: false }, 1);
    expect(result).toEqual({ newProgress: 5, isCompleted: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run server/weeklyChallenges.test.ts`
Expected: FAIL — `computeChallengeProgress` is not exported from `./db` (module has no such export).

- [ ] **Step 3: Add the function to server/db.ts**

In `server/db.ts`, immediately above the existing `export async function getOrCreateWeeklyChallenges` (currently at line 1981), add:

```ts
/** Pure progress calculation for a weekly challenge — no DB I/O, easy to unit test. */
export function computeChallengeProgress(
  current: { progress: number; target: number; completed: boolean },
  increment: number
): { newProgress: number; isCompleted: boolean } | null {
  if (current.completed) return null;
  const newProgress = Math.min(current.progress + increment, current.target);
  const isCompleted = newProgress >= current.target;
  return { newProgress, isCompleted };
}

```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run server/weeklyChallenges.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add server/db.ts server/weeklyChallenges.test.ts
git commit -m "Add computeChallengeProgress pure helper with unit tests"
```

---

### Task 2: Make `updateWeeklyChallengeProgress` return completion/XP data

**Files:**
- Modify: `server/db.ts:2052-2092` (the existing `updateWeeklyChallengeProgress` function)

**Interfaces:**
- Consumes: `computeChallengeProgress` from Task 1; existing `addUserXp(userId: number, xpAmount: number): Promise<{ level: number; xp: number; xpToNextLevel: number; leveledUp: boolean }>` (server/db.ts:1931, unchanged).
- Produces: `updateWeeklyChallengeProgress(userId: number, challengeKey: string, increment?: number): Promise<{ completed: boolean; title: string; xpReward: number; leveledUp: boolean; newLevel: number } | null>`. Tasks 4 and 5 consume this return value.

No new automated test here — every branch requires a live DB connection (`getDb()` returns `null` in this repo's test environment since `DATABASE_URL` is unset), which is exactly why Task 1 pulled the testable part out first. This task is verified by type-check plus the manual review in Task 9.

- [ ] **Step 1: Replace the function body**

Replace the current `updateWeeklyChallengeProgress` (server/db.ts, currently lines 2052-2092):

```ts
export async function updateWeeklyChallengeProgress(userId: number, challengeKey: string, increment = 1) {
  const db = await getDb();
  if (!db) return;

  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  const weekStart = monday.toISOString().split("T")[0]!;

  const challenge = await db
    .select()
    .from(weeklyChallenges)
    .where(
      and(
        eq(weeklyChallenges.userId, userId),
        eq(weeklyChallenges.weekStart, weekStart),
        eq(weeklyChallenges.challengeKey, challengeKey)
      )
    )
    .limit(1);

  if (!challenge[0] || challenge[0].completed) return;

  const newProgress = Math.min(challenge[0].progress + increment, challenge[0].target);
  const isCompleted = newProgress >= challenge[0].target;

  await db
    .update(weeklyChallenges)
    .set({
      progress: newProgress,
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
    })
    .where(eq(weeklyChallenges.id, challenge[0].id));

  // Si complété, donner l'XP
  if (isCompleted) {
    await addUserXp(userId, challenge[0].xpReward);
  }
}
```

with:

```ts
export async function updateWeeklyChallengeProgress(userId: number, challengeKey: string, increment = 1) {
  const db = await getDb();
  if (!db) return null;

  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  const weekStart = monday.toISOString().split("T")[0]!;

  const challenge = await db
    .select()
    .from(weeklyChallenges)
    .where(
      and(
        eq(weeklyChallenges.userId, userId),
        eq(weeklyChallenges.weekStart, weekStart),
        eq(weeklyChallenges.challengeKey, challengeKey)
      )
    )
    .limit(1);

  if (!challenge[0]) return null;

  const progressUpdate = computeChallengeProgress(challenge[0], increment);
  if (!progressUpdate) return null;

  const { newProgress, isCompleted } = progressUpdate;

  await db
    .update(weeklyChallenges)
    .set({
      progress: newProgress,
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
    })
    .where(eq(weeklyChallenges.id, challenge[0].id));

  if (!isCompleted) {
    return { completed: false, title: challenge[0].title, xpReward: challenge[0].xpReward, leveledUp: false, newLevel: 0 };
  }

  // Complété : attribuer l'XP et remonter le résultat au caller
  const xpResult = await addUserXp(userId, challenge[0].xpReward);
  return {
    completed: true,
    title: challenge[0].title,
    xpReward: challenge[0].xpReward,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.level,
  };
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: 0 errors (the three existing callers — two inside `updateUserStreak`, one in `quiz.submit` — still compile because they currently discard the return value, and `void`-ignoring a non-void return is legal TypeScript).

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: all existing tests still pass (150 passed before this change; this function has no direct callers in tests yet).

- [ ] **Step 4: Commit**

```bash
git add server/db.ts
git commit -m "Return completion/XP data from updateWeeklyChallengeProgress"
```

---

### Task 3: Surface level-up data from `updateUserStreak`

**Files:**
- Modify: `server/db.ts:397` (function signature) and `:456-464` (XP + return statement) — function currently spans lines 397-465

**Interfaces:**
- Consumes: `addUserXp` (unchanged), `updateWeeklyChallengeProgress` (Task 2's new return shape — discarded here, unused by this function).
- Produces: `updateUserStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number; totalCheckIns: number; newAchievements: string[]; leveledUp: boolean; level: number }>`. Task 6 (`checkIns.create` client wiring) consumes `leveledUp` and `level` from this via `result.streak`.

`updateUserStreak` already calls `addUserXp(userId, 10)` for every check-in but throws away the result, so today there is no way for a check-in to report a level-up to the client. This task captures it.

- [ ] **Step 1: Update the function signature**

In `server/db.ts`, change (currently line 397):

```ts
export async function updateUserStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number; totalCheckIns: number; newAchievements: string[] }> {
  const db = await getDb();
  if (!db) return { currentStreak: 0, longestStreak: 0, totalCheckIns: 0, newAchievements: [] };
```

to:

```ts
export async function updateUserStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number; totalCheckIns: number; newAchievements: string[]; leveledUp: boolean; level: number }> {
  const db = await getDb();
  if (!db) return { currentStreak: 0, longestStreak: 0, totalCheckIns: 0, newAchievements: [], leveledUp: false, level: 1 };
```

- [ ] **Step 2: Capture the XP result and include it in the return**

Change (currently around lines 456-464):

```ts
  // Ajouter de l'XP pour le check-in (10 XP par check-in)
  await addUserXp(userId, 10);

  // Mettre à jour les défis hebdomadaires
  await updateWeeklyChallengeProgress(userId, "checkins_5", 1);

  // Vérifier si on a fait 3 jours consécutifs
  if (currentStreak >= 3) {
    await updateWeeklyChallengeProgress(userId, "streak_3", 1);
  }

  return { currentStreak, longestStreak, totalCheckIns, newAchievements };
}
```

to:

```ts
  // Ajouter de l'XP pour le check-in (10 XP par check-in)
  const xpResult = await addUserXp(userId, 10);

  // Mettre à jour les défis hebdomadaires
  await updateWeeklyChallengeProgress(userId, "checkins_5", 1);

  // Vérifier si on a fait 3 jours consécutifs
  if (currentStreak >= 3) {
    await updateWeeklyChallengeProgress(userId, "streak_3", 1);
  }

  return { currentStreak, longestStreak, totalCheckIns, newAchievements, leveledUp: xpResult.leveledUp, level: xpResult.level };
}
```

- [ ] **Step 3: Type-check and run full suite**

Run: `pnpm check && pnpm test`
Expected: 0 TypeScript errors, all tests still pass.

- [ ] **Step 4: Commit**

```bash
git add server/db.ts
git commit -m "Surface leveledUp/level from updateUserStreak"
```

---

### Task 4: Fix `compass_complete` wiring and thread challenge results through routers

**Files:**
- Modify: `server/routers.ts:812-815` (remove incorrect trigger in `checkIns.create`)
- Modify: `server/routers.ts:936-963` (add correct trigger in `sevenMirrors.submitMirrorResponse`)
- Modify: `server/routers.ts:1479-1483` (surface `challengeResult` from `quiz.submit`)

**Interfaces:**
- Consumes: `updateWeeklyChallengeProgress` (Task 2's new return shape).
- Produces: `sevenMirrors.submitMirrorResponse` mutation now returns `{ completed: true; summary: string; badges: string[]; challengeResult: ReturnType<typeof updateWeeklyChallengeProgress> extends Promise<infer T> ? T : never } | { completed: false; nextMirrorIndex: number }` — Task 8 (SevenMirrors.tsx) consumes the `completed: true` branch's `challengeResult`. `quiz.submit` now returns `{ ...attempt, scores, level, aiInsight, challengeResult }` — Task 7 (EIQuiz.tsx) consumes `challengeResult`.

- [ ] **Step 1: Remove the incorrect `compass_complete` trigger from `checkIns.create`**

In `server/routers.ts`, delete this block (currently lines 812-815, right after `const streakData = await updateUserStreak(ctx.user.id);`):

```ts
        // Mettre à jour le défi "Self Trust Compass"
        if (input.context === "Self") {
          await updateWeeklyChallengeProgress(ctx.user.id, "compass_complete", 1);
        }
```

So the code goes directly from `const streakData = await updateUserStreak(ctx.user.id);` to the `return { checkInId, ... }` statement, with no `compass_complete` reference remaining in `checkIns.create`.

- [ ] **Step 2: Add the correct trigger to `sevenMirrors.submitMirrorResponse`**

In `server/routers.ts`, change the `isLast` branch (currently lines 936-963 within `submitMirrorResponse`):

```ts
        const isLast = input.mirrorIndex === 6;
        if (isLast) {
          const allResponses = await getSevenMirrorsResponsesBySession(input.sessionId);
          const { summary, badges } = await generateSevenMirrorsSummary(allResponses);
          await completeSevenMirrorsSession(input.sessionId, summary, badges);
          return { completed: true, summary, badges };
        }

        return { completed: false, nextMirrorIndex: input.mirrorIndex + 1 };
```

to:

```ts
        const isLast = input.mirrorIndex === 6;
        if (isLast) {
          const allResponses = await getSevenMirrorsResponsesBySession(input.sessionId);
          const { summary, badges } = await generateSevenMirrorsSummary(allResponses);
          await completeSevenMirrorsSession(input.sessionId, summary, badges);
          const challengeResult = await updateWeeklyChallengeProgress(ctx.user.id, "compass_complete", 1);
          return { completed: true, summary, badges, challengeResult };
        }

        return { completed: false, nextMirrorIndex: input.mirrorIndex + 1 };
```

- [ ] **Step 3: Surface `challengeResult` from `quiz.submit`**

In `server/routers.ts`, change (currently lines 1479-1483):

```ts
        // Mettre à jour le défi EI Quiz
        await updateWeeklyChallengeProgress(ctx.user.id, "ei_quiz", 1);

        return { ...attempt, scores, level, aiInsight };
```

to:

```ts
        // Mettre à jour le défi EI Quiz
        const challengeResult = await updateWeeklyChallengeProgress(ctx.user.id, "ei_quiz", 1);

        return { ...attempt, scores, level, aiInsight, challengeResult };
```

- [ ] **Step 4: Type-check and run full suite**

Run: `pnpm check && pnpm test`
Expected: 0 TypeScript errors, all tests pass. (`eiQuiz.test.ts`'s existing "returns 25 questions via tRPC caller" test hits `quiz.getQuestions`, not `quiz.submit`, so it's unaffected.)

- [ ] **Step 5: Commit**

```bash
git add server/routers.ts
git commit -m "Fix compass_complete trigger and thread challenge results through routers"
```

---

### Task 5: Reward toasts in the check-in flow

**Files:**
- Modify: `client/src/pages/CheckIn.tsx:224-236`

**Interfaces:**
- Consumes: `createCheckIn.mutateAsync(payload)`'s resolved value, specifically `result.streak.leveledUp: boolean`, `result.streak.level: number`, `result.streak.newAchievements: string[]` (all from Task 3's `updateUserStreak` return shape, threaded through unchanged by `checkIns.create`). `toast` from `sonner` (already imported in this file).

- [ ] **Step 1: Add toast calls after a successful authenticated check-in**

In `client/src/pages/CheckIn.tsx`, change (currently lines 224-236):

```tsx
      if (isAuthenticated && wantsSave) {
        const result = await createCheckIn.mutateAsync(payload);
        checkInId = result.checkInId;
        interventionData = result.intervention;
      } else {
```

to:

```tsx
      if (isAuthenticated && wantsSave) {
        const result = await createCheckIn.mutateAsync(payload);
        checkInId = result.checkInId;
        interventionData = result.intervention;

        if (result.streak?.leveledUp) {
          toast.success(`🎉 Level up! You're now Level ${result.streak.level}`);
        }
        result.streak?.newAchievements?.forEach((achievement, i) => {
          setTimeout(() => toast.success(achievement), (i + 1) * 600);
        });
      } else {
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 3: Manual verification (requires a configured `DATABASE_URL` and a logged-in test user — skip if no local DB is set up, and note that in the PR/commit)**

Run: `pnpm dev`, log in, submit a check-in as a user close to a level-up threshold (or freshly seeded at 0 XP with a small `getXpRequiredForLevel`), and confirm a "🎉 Level up!" toast appears. Not required to pass this task if no local DB is configured — see Task 9's manual verification note.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/CheckIn.tsx
git commit -m "Show level-up and badge toasts after check-in"
```

---

### Task 6: Reward toasts in the EI Quiz flow

**Files:**
- Modify: `client/src/pages/EIQuiz.tsx:1-14` (add `sonner` import)
- Modify: `client/src/pages/EIQuiz.tsx:100-116` (`handleNext` submit branch)

**Interfaces:**
- Consumes: `submitAuth.mutateAsync({ answers })`'s resolved value, specifically `result.challengeResult` (Task 4's `quiz.submit` return shape: `{ completed: boolean; title: string; xpReward: number; leveledUp: boolean; newLevel: number } | null`).

- [ ] **Step 1: Import `toast`**

In `client/src/pages/EIQuiz.tsx`, change the import block (currently lines 1-14):

```tsx
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import NavBar from "@/components/NavBar";
```

to:

```tsx
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import NavBar from "@/components/NavBar";
```

- [ ] **Step 2: Add toast calls after a successful authenticated submission**

In `client/src/pages/EIQuiz.tsx`, change (currently lines 100-116, inside `handleNext`):

```tsx
      // Submit
      setSubmitting(true);
      try {
        let result;
        if (user) {
          result = await submitAuth.mutateAsync({ answers });
        } else {
          result = await submitGuest.mutateAsync({ answers });
        }
        sessionStorage.setItem("headcheck_quiz_result", JSON.stringify(result));
        navigate("/ei-quiz/result");
      } catch (err) {
        console.error("Quiz submission error:", err);
        setSubmitting(false);
      }
```

to:

```tsx
      // Submit
      setSubmitting(true);
      try {
        let result;
        if (user) {
          result = await submitAuth.mutateAsync({ answers });
          if (result.challengeResult?.completed) {
            toast.success(`🏆 Challenge completed: ${result.challengeResult.title} (+${result.challengeResult.xpReward} XP)`);
            if (result.challengeResult.leveledUp) {
              setTimeout(() => toast.success(`🎉 Level up! You're now Level ${result.challengeResult!.newLevel}`), 600);
            }
          }
        } else {
          result = await submitGuest.mutateAsync({ answers });
        }
        sessionStorage.setItem("headcheck_quiz_result", JSON.stringify(result));
        navigate("/ei-quiz/result");
      } catch (err) {
        console.error("Quiz submission error:", err);
        setSubmitting(false);
      }
```

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/EIQuiz.tsx
git commit -m "Show challenge-completed and level-up toasts after EI quiz submission"
```

---

### Task 7: Reward toasts in the Seven Mirrors flow

**Files:**
- Modify: `client/src/pages/SevenMirrors.tsx:116-142` (`handleNext`)

**Interfaces:**
- Consumes: `submitMirrorResponse.mutateAsync(...)`'s resolved value from Task 4's updated `sevenMirrors.submitMirrorResponse` — narrow on `response.completed === true` to access `response.challengeResult`. `toast` from `sonner` (already imported in this file, line 8).

- [ ] **Step 1: Capture the mutation result and add toast calls**

In `client/src/pages/SevenMirrors.tsx`, change `handleNext` (currently lines 116-142):

```tsx
  const handleNext = async () => {
    saveExtras();
    const ans = answers[currentMirror] || { selected: [] };
    const selected = showOther && otherText.trim() ? [...ans.selected, otherText.trim()] : ans.selected;

    if (isAuthenticated && sessionId) {
      try {
        await submitMirrorResponse.mutateAsync({
          sessionId,
          mirrorIndex: currentMirror,
          response: selected.join("; ") + (journalText ? "\n" + journalText : ""),
        });
      } catch {
        toast.error("Could not save response. Continuing...");
      }
    }

    setShowOther(false);
    setOtherText("");
    setJournalText("");

    if (currentMirror < SEVEN_MIRRORS.length - 1) {
      setCurrentMirror(currentMirror + 1);
    } else {
      await handleComplete();
    }
  };
```

to:

```tsx
  const handleNext = async () => {
    saveExtras();
    const ans = answers[currentMirror] || { selected: [] };
    const selected = showOther && otherText.trim() ? [...ans.selected, otherText.trim()] : ans.selected;

    if (isAuthenticated && sessionId) {
      try {
        const response = await submitMirrorResponse.mutateAsync({
          sessionId,
          mirrorIndex: currentMirror,
          response: selected.join("; ") + (journalText ? "\n" + journalText : ""),
        });
        if (response.completed && response.challengeResult?.completed) {
          toast.success(`🏆 Challenge completed: ${response.challengeResult.title} (+${response.challengeResult.xpReward} XP)`);
          if (response.challengeResult.leveledUp) {
            setTimeout(() => toast.success(`🎉 Level up! You're now Level ${response.challengeResult!.newLevel}`), 600);
          }
        }
      } catch {
        toast.error("Could not save response. Continuing...");
      }
    }

    setShowOther(false);
    setOtherText("");
    setJournalText("");

    if (currentMirror < SEVEN_MIRRORS.length - 1) {
      setCurrentMirror(currentMirror + 1);
    } else {
      await handleComplete();
    }
  };
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: 0 errors. (`response.completed` narrows the union so `response.challengeResult` is only accessed in the `completed: true` branch.)

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/SevenMirrors.tsx
git commit -m "Show challenge-completed and level-up toasts after Seven Mirrors completion"
```

---

### Task 8: Fix French strings in LevelProgress.tsx

**Files:**
- Modify: `client/src/components/LevelProgress.tsx:34,40,45-47`

**Interfaces:**
- None — presentational-only change, no signature changes.

- [ ] **Step 1: Translate the French strings**

In `client/src/components/LevelProgress.tsx`, change (currently lines 33-47):

```tsx
            <div>
              <p className="text-xs text-muted-foreground">Niveau</p>
              <p className="text-2xl font-bold text-primary">{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{xp} / {xpToNextLevel} XP</p>
            <p className="text-xs text-muted-foreground">jusqu'au niveau {level + 1}</p>
          </div>
        </div>

        <Progress value={progress} className="h-2" />
        <p className="text-[10px] text-center mt-1.5 text-muted-foreground">
          {progress}% vers le niveau suivant
        </p>
```

to:

```tsx
            <div>
              <p className="text-xs text-muted-foreground">Level</p>
              <p className="text-2xl font-bold text-primary">{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{xp} / {xpToNextLevel} XP</p>
            <p className="text-xs text-muted-foreground">to level {level + 1}</p>
          </div>
        </div>

        <Progress value={progress} className="h-2" />
        <p className="text-[10px] text-center mt-1.5 text-muted-foreground">
          {progress}% to next level
        </p>
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/LevelProgress.tsx
git commit -m "Translate LevelProgress.tsx strings to American English"
```

---

### Task 9: Final verification

**Files:** None (verification only).

- [ ] **Step 1: Full type-check**

Run: `pnpm check`
Expected: 0 TypeScript errors.

- [ ] **Step 2: Full test suite**

Run: `pnpm test`
Expected: all test files pass, including the new `server/weeklyChallenges.test.ts` (155 total: 150 pre-existing + 5 new).

- [ ] **Step 3: Manual review checklist (in place of a live-DB manual test — this repo has no `DATABASE_URL` configured by default, so the reward flows can't be exercised end-to-end without standing up MySQL first)**

Confirm by reading the diff:
- [ ] `checkIns.create` no longer references `compass_complete` anywhere.
- [ ] `sevenMirrors.submitMirrorResponse`'s `isLast` branch calls `updateWeeklyChallengeProgress(ctx.user.id, "compass_complete", 1)` and returns `challengeResult`.
- [ ] `quiz.submit` returns `challengeResult`.
- [ ] All three client pages (`CheckIn.tsx`, `EIQuiz.tsx`, `SevenMirrors.tsx`) import `toast` from `"sonner"` and call `toast.success` only — no leftover French strings anywhere in the diff.
- [ ] `LevelProgress.tsx` contains no French text.

- [ ] **Step 4 (optional, only if a local `DATABASE_URL` is available): Live manual test**

Run: `pnpm dev`, then in a browser:
1. Log in as a test user, complete a check-in — expect no crash, and (if XP crosses a level threshold) a "🎉 Level up!" toast.
2. Take the EI Quiz to completion — expect a "🏆 Challenge completed: Take the EI Quiz (+30 XP)" toast on first completion this week.
3. Complete the Seven Mirrors journey (all 7 mirrors) — expect a "🏆 Challenge completed: Complete the Compass (+60 XP)" toast on the final mirror, not on an earlier one, and not merely from picking "Self" as a check-in context.

- [ ] **Step 5: Final commit (if any fixes were needed from this review)**

```bash
git add -A
git commit -m "Final verification pass for gamification fix + reward feedback"
```

(Skip this commit if Steps 1-4 found nothing to fix.)
