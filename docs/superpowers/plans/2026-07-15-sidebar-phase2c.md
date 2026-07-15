# Navigation Chrome Redesign — Phase 2c Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct `AppSidebar`'s navigation (remove sections linking to public, non-auth pages) and migrate the four remaining small auth-gated pages to it.

**Architecture:** Same wrapper-swap pattern used in every prior phase. The `AppSidebar` correction is a data change (fewer array entries, fewer icon imports); the four page migrations are each a 3-edit wrapper swap.

**Tech Stack:** React 19, existing `AppSidebar`/shadcn sidebar components.

## Global Constraints

- Only the five files named below change.
- No page's own auth/role logic changes.
- `FacilitatorDashboard.tsx` is explicitly out of scope for this plan (deferred to Phase 2d).
- The seven public pages named in the spec (`Resources`, `LearnEI`, `Mindset`, `AIEILibrary`, `FeelingWheel`, `SupportOptions`, `CrisisSupport`) are not touched by this plan at all.

---

### Task 1: Correct `AppSidebar.tsx` navigation

**Files:**
- Modify: `client/src/components/AppSidebar.tsx`

**Interfaces:**
- No signature changes.

- [ ] **Step 1: Replace `NAV_SECTIONS`**

Find:

```tsx
const NAV_SECTIONS: NavSection[] = [
  {
    label: "Today",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: CheckCircle2, label: "Check-In", path: "/checkin" },
      { icon: Compass, label: "Compass", path: "/compass" },
    ],
  },
  {
    label: "Learn & Resources",
    items: [
      { icon: BookOpen, label: "Resources", path: "/resources" },
      { icon: GraduationCap, label: "Learn EI", path: "/learn-ei" },
      { icon: Lightbulb, label: "Mindset", path: "/mindset" },
      { icon: Library, label: "AIEI Library", path: "/aiei-library" },
      { icon: CircleDot, label: "Feeling Wheel", path: "/feeling-wheel" },
    ],
  },
  {
    label: "Support",
    items: [
      { icon: NotebookPen, label: "Wellness Log", path: "/wellness-logbook" },
      { icon: HeartHandshake, label: "Support Options", path: "/support-options" },
      { icon: Heart, label: "Crisis Support", path: "/crisis-support" },
    ],
  },
];
```

Replace with:

```tsx
const NAV_SECTIONS: NavSection[] = [
  {
    label: "Today",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: CheckCircle2, label: "Check-In", path: "/checkin" },
      { icon: Compass, label: "Compass", path: "/compass" },
      { icon: NotebookPen, label: "Wellness Log", path: "/wellness-logbook" },
    ],
  },
];
```

- [ ] **Step 2: Remove the now-unused icon imports**

Find:

```tsx
  LayoutDashboard, CheckCircle2, Compass, BookOpen, GraduationCap,
  Lightbulb, Library, CircleDot, NotebookPen, HeartHandshake, Heart,
  BarChart3, TrendingUp, Shield, FileText, MessageCircle, Bell, User,
  LogOut, PanelLeft,
```

Replace with:

```tsx
  LayoutDashboard, CheckCircle2, Compass, NotebookPen,
  BarChart3, TrendingUp, Shield, FileText, MessageCircle, Bell, User,
  LogOut, PanelLeft,
```

- [ ] **Step 3: Verify**

Run: `npm run check`
Expected: no new errors. (`BookOpen`, `GraduationCap`, `Lightbulb`, `Library`,
`CircleDot`, `HeartHandshake`, `Heart` are gone from both the import and
the file; `NotebookPen` remains, now used only in the `"Today"` section.)

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AppSidebar.tsx
git commit -m "Remove public-page sections from AppSidebar, move Wellness Log to Today"
```

---

### Task 2: Migrate `WellnessLogbook.tsx`

**Files:**
- Modify: `client/src/pages/WellnessLogbook.tsx`

- [ ] **Step 1: Add the import**

Find:

```tsx
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
```

Replace with:

```tsx
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppSidebar from "@/components/AppSidebar";
```

- [ ] **Step 2: Swap the opening wrapper**

Find:

```tsx
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
```

Replace with:

```tsx
  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
```

- [ ] **Step 3: Swap the closing wrapper**

Find (the end of the file):

```tsx
      </div>
    </div>
  );
}
```

Replace with:

```tsx
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
git add client/src/pages/WellnessLogbook.tsx
git commit -m "Migrate WellnessLogbook.tsx to AppSidebar"
```

---

### Task 3: Migrate `WeeklyReport.tsx`

**Files:**
- Modify: `client/src/pages/WeeklyReport.tsx`

- [ ] **Step 1: Add the import**

Find:

```tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
```

Replace with:

```tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AppSidebar from "@/components/AppSidebar";
```

- [ ] **Step 2: Swap the opening wrapper**

Find:

```tsx
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
```

Replace with:

```tsx
  return (
    <AppSidebar>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
```

- [ ] **Step 3: Swap the closing wrapper**

Find (the end of the file):

```tsx
      </div>
    </div>
  );
}
```

Replace with:

```tsx
      </div>
    </AppSidebar>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: no new errors. (The `navigate("/dashboard"); return null;` early
return for non-admins is untouched — it renders nothing, so it needs no
wrapper.)

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/WeeklyReport.tsx
git commit -m "Migrate WeeklyReport.tsx to AppSidebar"
```

---

### Task 4: Migrate `PulseSurveys.tsx`

**Files:**
- Modify: `client/src/pages/PulseSurveys.tsx`

- [ ] **Step 1: Swap the import**

Find:

```tsx
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
```

Replace with:

```tsx
import AppSidebar from "@/components/AppSidebar";
```

- [ ] **Step 2: Swap the opening wrapper**

Find:

```tsx
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />
      <div className="container max-w-2xl py-8 space-y-6">
```

Replace with:

```tsx
  return (
    <AppSidebar>
      <div className="hc-gradient-bar h-1.5" />
      <div className="container max-w-2xl py-8 space-y-6">
```

- [ ] **Step 3: Swap the closing wrapper**

Find (the end of the file):

```tsx
      </div>
      <Footer />
    </div>
  );
}
```

Replace with:

```tsx
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
git add client/src/pages/PulseSurveys.tsx
git commit -m "Migrate PulseSurveys.tsx to AppSidebar"
```

---

### Task 5: Migrate `TeamSentiment.tsx`

**Files:**
- Modify: `client/src/pages/TeamSentiment.tsx`

- [ ] **Step 1: Swap the import**

Find:

```tsx
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
```

Replace with:

```tsx
import AppSidebar from "@/components/AppSidebar";
```

- [ ] **Step 2: Swap the opening wrapper**

Find:

```tsx
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />
      <div className="container max-w-5xl py-8 space-y-6">
```

Replace with:

```tsx
  return (
    <AppSidebar>
      <div className="hc-gradient-bar h-1.5" />
      <div className="container max-w-5xl py-8 space-y-6">
```

- [ ] **Step 3: Swap the closing wrapper**

Find (the end of the file):

```tsx
      </div>
      <Footer />
    </div>
  );
}
```

Replace with:

```tsx
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
git add client/src/pages/TeamSentiment.tsx
git commit -m "Migrate TeamSentiment.tsx to AppSidebar"
```

---

### Task 6: Visual verification

**Files:** none modified unless a fix is needed.

**Interfaces:**
- Consumes: the running app from Tasks 1-5, at `/wellness-logbook`,
  `/admin/weekly-report`, `/pulse-surveys`, `/team-sentiment`.

- [ ] **Step 1: Start the app locally with authenticated sessions**

Same environment approach as Phase 2b's Task 5: `headcheck-preview-db`
Docker container, worktree-local `.env` (including `VITE_APP_ID`),
temporary local-only `sameSite: "lax"` edit to `server/_core/cookies.ts`
(revert before finishing, never commit), `node_modules\.bin\tsx.cmd watch
server/_core/index.ts` if `npm run dev` fights `cmd.exe`. Verify port 3000
is free before starting.

Reuse the student and facilitator/admin test accounts from Phase 2b if
they still exist in the local database; register/promote fresh ones via
the same approach (`/register`, then `UPDATE users SET role = 'admin'
WHERE email = '...'` against the local `headcheck-preview-db` container
only) if not.

`/admin/weekly-report` requires `role = 'admin'` or `'superadmin'`
specifically (not `'facilitator'`) — confirm the promoted test account's
role is actually `admin` before testing this page, or the page will
redirect to `/dashboard` and you'll wrongly conclude it's broken.

- [ ] **Step 2: Capture screenshots**

Using Puppeteer (same pattern as prior verification tasks):
- `/wellness-logbook` (student account) — desktop width, confirm the
  sidebar renders alongside the logbook content.
- `/admin/weekly-report` (admin account) — desktop width, confirm the
  sidebar renders alongside the report preview UI.
- `/pulse-surveys` (any authenticated account with institution access, or
  note if none is easily reachable) — desktop width.
- `/team-sentiment` (same) — desktop width.
- Open the sidebar (either account) and confirm: no "Learn & Resources" or
  "Support" section appears anywhere; "Wellness Log" appears under
  "Today", after "Compass".

- [ ] **Step 3: Compare against the design spec**

Check against `docs/superpowers/specs/2026-07-15-sidebar-phase2c-design.md`
and the established visual language from prior phases.

- [ ] **Step 4: Fix any visual issues found**

If a screenshot reveals a problem, fix it directly in the relevant file
(small, targeted fixes only), re-screenshot to confirm, then commit:
`git commit -m "Fix visual issues found in Phase 2c verification pass"`.

- [ ] **Step 5: Confirm cleanup and report**

Confirm the temporary `cookies.ts` edit was reverted (`git status` / `git
diff --stat` show nothing for that file). Summarize what was checked, what
(if anything) needed fixing, and confirm the sidebar's corrected section
list.
