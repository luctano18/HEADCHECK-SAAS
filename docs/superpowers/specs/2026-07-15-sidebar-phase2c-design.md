# Navigation Chrome Redesign — Phase 2c: Sidebar Correction + Facilitator/Wellness Pages

**Date:** 2026-07-15
**Status:** Approved

## Context

Investigating this batch (originally assumed to be "Learn & Resources" +
"Support") found that **none** of those seven pages
(`Resources`, `LearnEI`, `Mindset`, `AIEILibrary`, `FeelingWheel`,
`SupportOptions`, `CrisisSupport`) require authentication — none of them
call `useAuth()` to gate access (`Mindset` calls it only to swap one CTA
button's destination, not to gate the page). They are public content pages,
in the same category as `CheckIn`/`SevenMirrors` (already excluded from
the sidebar in Phase 2b for the same reason: guest/public access).

This means Phase 2a's original `AppSidebar` design put two whole sections
in the wrong place — `"Learn & Resources"` and `"Support"` link to pages
that render with the marketing `NavBar`, not `AppSidebar`. Clicking either
section's items from inside the sidebar would yank an authenticated user
out of the sidebar shell into the navbar shell — a jarring, unintended
layout switch mid-navigation, not the polished experience the redesign is
meant to deliver.

This spec corrects that, then continues with the real remaining
auth-gated pages: `WellnessLogbook`, `WeeklyReport`, `PulseSurveys`,
`TeamSentiment`. `FacilitatorDashboard.tsx` (1,413 lines) is deliberately
excluded — its size warrants a dedicated phase (2d) rather than folding it
into this batch.

## Scope

In scope:
- `AppSidebar.tsx`: remove the `"Learn & Resources"` and `"Support"`
  sections entirely. Add `"Wellness Log"` to the existing `"Today"`
  section (a personal practice/journal tool, the same spirit as
  Dashboard/Check-In/Compass).
- Migrate `WellnessLogbook.tsx`, `WeeklyReport.tsx`, `PulseSurveys.tsx`,
  `TeamSentiment.tsx` to `AppSidebar`, using the same conservative pattern
  as every prior migration (swap only the outer wrapper).

Out of scope:
- The seven public pages named above — they keep `NavBar` permanently,
  same status as `CheckIn`/`SevenMirrors`.
- `FacilitatorDashboard.tsx` — deferred to Phase 2d.
- Any change to `NavBar.tsx`'s own link list. (Separately worth noting,
  not part of this spec: `LearnEI`, `AIEILibrary`, `FeelingWheel`, and
  `CrisisSupport` aren't currently in `NavBar`'s `NAV_LINKS` at all — a
  pre-existing gap in the public site's navigation, unrelated to the
  sidebar work. Flagging for awareness, not fixing here.)

## Design

### 1. `AppSidebar.tsx` correction

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

The now-unused icon imports (`BookOpen`, `GraduationCap`, `Lightbulb`,
`Library`, `CircleDot`, `HeartHandshake`, `Heart`) are removed from the
`lucide-react` import list — `NotebookPen` stays (still used, just moved).
Removing unused imports here isn't optional cosmetic cleanup: this repo's
`tsc --noEmit` build doesn't flag unused imports as errors, but leaving
them would silently mislead a future reader into thinking those pages are
still sidebar-linked.

### 2. Page migrations

All four follow the exact pattern established in Phase 2a
(`Dashboard.tsx`) and reused throughout Phase 2b: add the `AppSidebar`
import, swap the outermost `<div className="min-h-screen ...">` for
`<AppSidebar>`/`</AppSidebar>`. `WellnessLogbook.tsx` and `WeeklyReport.tsx`
currently render no navbar at all (like `Messages.tsx`/`Profile.tsx` in
Phase 2b — this is a net improvement, not just a re-skin).
`PulseSurveys.tsx` and `TeamSentiment.tsx` currently use `<NavBar />`
directly (like `Dashboard.tsx`/`Notifications.tsx`), each in a single
render branch — no multi-branch complexity to navigate this time.

No page's own auth/role logic changes.

### Error Handling

No new error paths — same reasoning as every prior phase: each page's own
guard (or lack thereof, where the page simply queries auth-gated data via
`protectedProcedure` and lets the server enforce it) is preserved exactly.

### Testing

No unit-testable logic. Verification is visual: Puppeteer screenshots of
all four migrated pages, plus a check that the corrected `AppSidebar` no
longer shows "Learn & Resources"/"Support" sections and does show
"Wellness Log" under "Today", for both a student and a facilitator/admin
account (reusing test accounts from Phase 2b's verification where
possible).
