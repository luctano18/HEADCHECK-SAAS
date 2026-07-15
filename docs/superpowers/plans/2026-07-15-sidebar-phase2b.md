# Navigation Chrome Redesign — Phase 2b (Account Pages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct `AppSidebar`'s nav grouping (Notifications is facilitator-only, not general) and migrate `Messages.tsx`, `Profile.tsx`, and `Notifications.tsx` to `AppSidebar`.

**Architecture:** Same pattern established in Phase 2a's `Dashboard.tsx` migration — swap each page's outer layout wrapper for `<AppSidebar>...</AppSidebar>`, no changes to inner content or logic. `Messages.tsx` and `Profile.tsx` currently have no navbar at all (custom ad-hoc headers instead); `Notifications.tsx` currently uses `<NavBar />` in two render branches.

**Tech Stack:** React 19, existing `AppSidebar`/shadcn sidebar components.

## Global Constraints

- Only the four files named below change. No other page's layout changes.
- Each page's own auth/role guard (`if (!user)`, `if (!authUser)`,
  `if (!isAuthenticated || !isAdminRole)`) stays exactly as-is, including
  its fallback UI copy — `AppSidebar`'s own loading/unauthenticated gate is
  never reached in practice for these pages, and that's fine, not a bug to
  fix.
- `Messages.tsx` and `Profile.tsx` keep their own internal ad-hoc headers
  (the manual back-button bars) — do not remove them in this plan.
- `Messages.tsx`'s `h-[calc(100vh-57px)]` chat-height calculation is a
  known risk — Task 5 must actually look at it rendered and fix if it
  overflows or leaves a gap; do not assume it's fine without checking.

---

### Task 1: Fix `AppSidebar.tsx` nav grouping

**Files:**
- Modify: `client/src/components/AppSidebar.tsx`

**Interfaces:**
- No signature changes — `FACILITATOR_SECTION`/`ACCOUNT_SECTION` remain the same `NavSection` type, only their `items` arrays change.

- [ ] **Step 1: Move "Notifications" from Account to Facilitator**

Find:

```tsx
const FACILITATOR_SECTION: NavSection = {
  label: "Facilitator",
  items: [
    { icon: Shield, label: "Facilitator Dashboard", path: "/facilitator" },
    { icon: FileText, label: "Weekly Report", path: "/admin/weekly-report" },
  ],
};

const ACCOUNT_SECTION: NavSection = {
  label: "Account",
  items: [
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
};
```

Replace with:

```tsx
const FACILITATOR_SECTION: NavSection = {
  label: "Facilitator",
  items: [
    { icon: Shield, label: "Facilitator Dashboard", path: "/facilitator" },
    { icon: FileText, label: "Weekly Report", path: "/admin/weekly-report" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ],
};

const ACCOUNT_SECTION: NavSection = {
  label: "Account",
  items: [
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
};
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: no new errors. (`Bell` stays imported and used, just at a
different call site — no import list change needed.)

- [ ] **Step 3: Commit**

```bash
git add client/src/components/AppSidebar.tsx
git commit -m "Move Notifications to the Facilitator sidebar section"
```

---

### Task 2: Migrate `Messages.tsx` to `AppSidebar`

**Files:**
- Modify: `client/src/pages/Messages.tsx`

**Interfaces:**
- Consumes: `AppSidebar` default export.

- [ ] **Step 1: Add the import**

Find:

```tsx
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
```

Replace with:

```tsx
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppSidebar from "@/components/AppSidebar";
```

- [ ] **Step 2: Swap the opening wrapper**

Find:

```tsx
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
```

Replace with:

```tsx
  return (
    <AppSidebar>
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
```

- [ ] **Step 3: Swap the closing wrapper**

Find (the end of the file):

```tsx
        </div>
      </div>
    </div>
  );
}
```

Replace with:

```tsx
        </div>
      </div>
    </AppSidebar>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Messages.tsx
git commit -m "Migrate Messages.tsx to AppSidebar"
```

---

### Task 3: Migrate `Profile.tsx` to `AppSidebar`

**Files:**
- Modify: `client/src/pages/Profile.tsx`

**Interfaces:**
- Consumes: `AppSidebar` default export.

- [ ] **Step 1: Add the import**

Find:

```tsx
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
```

Replace with:

```tsx
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
```

- [ ] **Step 2: Swap the opening wrapper**

Find:

```tsx
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40">
      {/* Top bar */}
```

Replace with:

```tsx
  return (
    <AppSidebar>
      {/* Top bar */}
```

- [ ] **Step 3: Swap the closing wrapper**

Find (the end of the file):

```tsx
        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
```

Replace with:

```tsx
        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </AppSidebar>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Profile.tsx
git commit -m "Migrate Profile.tsx to AppSidebar"
```

---

### Task 4: Migrate `Notifications.tsx` to `AppSidebar`

**Files:**
- Modify: `client/src/pages/Notifications.tsx`

**Interfaces:**
- Consumes: `AppSidebar` default export.

- [ ] **Step 1: Swap the import**

Find:

```tsx
import NavBar from "@/components/NavBar";
```

Replace with:

```tsx
import AppSidebar from "@/components/AppSidebar";
```

- [ ] **Step 2: Swap the "Access Restricted" branch's wrapper**

Find:

```tsx
  if (!isAuthenticated || !isAdminRole) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.25 0.04 260)" }}>
            Access Restricted
          </h1>
          <p className="text-muted-foreground">
            Notifications are available for admin and facilitator accounts only.
          </p>
        </div>
      </div>
    );
  }
```

Replace with:

```tsx
  if (!isAuthenticated || !isAdminRole) {
    return (
      <AppSidebar>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.25 0.04 260)" }}>
            Access Restricted
          </h1>
          <p className="text-muted-foreground">
            Notifications are available for admin and facilitator accounts only.
          </p>
        </div>
      </AppSidebar>
    );
  }
```

- [ ] **Step 3: Swap the main branch's opening wrapper**

Find:

```tsx
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.01 260)" }}>
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-10">
```

Replace with:

```tsx
  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto px-4 py-10">
```

- [ ] **Step 4: Swap the main branch's closing wrapper**

Find (the end of the file):

```tsx
        </div>
      </div>
    </div>
  );
}
```

Replace with:

```tsx
        </div>
      </div>
    </AppSidebar>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm run check`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Notifications.tsx
git commit -m "Migrate Notifications.tsx to AppSidebar"
```

---

### Task 5: Visual verification

**Files:** none modified unless a fix is needed.

**Interfaces:**
- Consumes: the running app from Tasks 1-4, at `/messages`, `/profile`, `/notifications`.

- [ ] **Step 1: Start the app locally with authenticated sessions**

Same environment approach as Phase 2a's Task 4: `headcheck-preview-db`
Docker container, worktree-local `.env`, temporary local-only
`sameSite: "lax"` edit to `server/_core/cookies.ts` (revert before
finishing, never commit), `node_modules\.bin\tsx.cmd watch
server/_core/index.ts` if `npm run dev` fights `cmd.exe`.

This task needs **two** test accounts, unlike Phase 2a which only needed
one:
1. A regular student account (register via `/register` — no `institutionId`,
   default `role: "student"`).
2. A facilitator or admin account, needed specifically to reach
   `/notifications`'s main branch (its "Access Restricted" branch is
   reachable by anyone, but that's the less interesting state to verify).
   Check whether the seeded local database already has a way to promote a
   user to `facilitator`/`admin` (e.g., a dev-only script, or direct SQL
   against the local `headcheck-preview-db` container: `UPDATE users SET
   role = 'admin' WHERE email = '...'` is acceptable for this local-only
   verification database — never do this against a production database).

- [ ] **Step 2: Capture screenshots**

Using Puppeteer (same pattern as prior verification tasks):
- `/messages` (student account) — desktop width, confirm the sidebar
  renders alongside the chat UI and the chat column fills the available
  height correctly (no overflow past the viewport, no visible gap at the
  bottom). If it doesn't look right, this is the known risk flagged in the
  spec — proceed to Step 4.
- `/messages` — mobile width (390px), confirm the sidebar collapses to the
  mobile top-bar pattern and the chat UI is still usable underneath/behind
  it.
- `/profile` (student account) — desktop width, confirm the sidebar
  renders correctly alongside the profile form.
- `/notifications` (student account) — desktop width, confirm the "Access
  Restricted" message renders inside the sidebar shell correctly.
- `/notifications` (facilitator/admin account) — desktop width, confirm
  the actual notifications list renders correctly inside the sidebar shell.
- On the facilitator/admin account, open the sidebar and confirm
  "Notifications" now appears under the "Facilitator" section, not
  "Account" — and confirm a student account's sidebar does NOT show a
  "Notifications" item anywhere.

- [ ] **Step 3: Compare against the design spec**

Check against `docs/superpowers/specs/2026-07-15-sidebar-phase2b-design.md`
and the established visual language from Phase 2a (espresso sidebar,
terracotta active states, legible text throughout).

- [ ] **Step 4: Fix any visual issues found**

If `Messages.tsx`'s height calc overflows or gaps (the known risk), adjust
the `h-[calc(100vh-57px)]` value directly in `client/src/pages/Messages.tsx`
to account for `AppSidebar`'s actual rendered chrome height at that
viewport — determine the right value empirically from what's actually
rendering (e.g., inspect the real heights in devtools) rather than
guessing. For any other visual issue found, fix it directly in the
relevant file (small, targeted fixes only), re-screenshot to confirm, then
commit: `git commit -m "Fix visual issues found in Phase 2b verification pass"`.

- [ ] **Step 5: Confirm cleanup and report**

Confirm the temporary `cookies.ts` edit from Step 1 was reverted
(`git status` / `git diff --stat` show nothing for that file). Summarize
what was checked, what (if anything) needed fixing, and confirm both test
accounts' sidebars showed the correct role-conditional sections.
