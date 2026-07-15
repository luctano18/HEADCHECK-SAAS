# Navigation Chrome Redesign — Phase 2b: Account Pages Migration

**Date:** 2026-07-15
**Status:** Approved

## Context

Phase 2a shipped `AppSidebar` and migrated one pilot page (`Dashboard.tsx`).
This spec covers the next batch: `Messages.tsx`, `Notifications.tsx`, and
`Profile.tsx`. No new visual design work is needed — the espresso/terracotta
direction, tokens, and `AppSidebar` component are already built and
approved; this is purely applying the established pattern to three more
pages.

Two pages originally assumed to belong to this batch's neighbor —
`CheckIn.tsx` and `SevenMirrors.tsx` (Compass) — were investigated and
found to support guest (unauthenticated) access via `guestCreate`/
`guestSummary` mutations. `AppSidebar` hard-gates on `useAuth()`'s `user`
being present, so wrapping either page in it would break guest check-ins —
a regression on a core, publicly-accessible feature. Decision: both stay on
the marketing `NavBar` permanently, not just deferred to a later batch.

Investigating this batch's three pages surfaced two things worth noting
before migrating them:

- `Messages.tsx` and `Profile.tsx` currently render **no navigation chrome
  at all** — each has its own ad-hoc sticky header with a manual "back"
  button (`ArrowLeft` + `navigate(...)`) instead of `<NavBar />`. Migrating
  them to `AppSidebar` is a net improvement (consistent navigation restored
  to pages that currently lack it), not just a re-skin.
- `Notifications.tsx` is gated to `admin`/`superadmin`/`facilitator` roles
  only (`if (!isAuthenticated || !isAdminRole) return <Access Restricted>`)
  — it is **not** a general-audience page. Phase 2a's `AppSidebar` placed
  "Notifications" in `ACCOUNT_SECTION` (visible to every authenticated
  user), which means a regular student currently sees a nav item that
  dead-ends at "Access Restricted." This spec corrects that: moving
  "Notifications" from `ACCOUNT_SECTION` to `FACILITATOR_SECTION`, both
  already defined in `AppSidebar.tsx`.

## Scope

In scope:
- `AppSidebar.tsx`: move the "Notifications" entry from `ACCOUNT_SECTION`
  to `FACILITATOR_SECTION`.
- Migrate `Messages.tsx`, `Profile.tsx`, `Notifications.tsx` from their
  current wrappers to `<AppSidebar>`.
- For all three, the approach is conservative: swap only the outermost
  wrapper (`<div className="min-h-screen ...">` → `<AppSidebar>`, matching
  closing tag). Each page's own internal header (the ad-hoc back button in
  `Messages.tsx`/`Profile.tsx`, the title/filter row in `Notifications.tsx`)
  is left in place, not removed — it's mildly redundant with the sidebar's
  own navigation now, but removing it risks breaking page-specific layout
  math (see the `Messages.tsx` height note below), and "trim it later" is
  cheap, reversible follow-up if the redundancy turns out to bother anyone
  in practice.

Out of scope:
- `CheckIn.tsx`, `SevenMirrors.tsx` — staying on `NavBar` permanently (see
  Context above).
- Removing the internal ad-hoc headers on `Messages.tsx`/`Profile.tsx` —
  deliberately left in place this phase (see above).
- Any other page not named above.

## Design

### 1. `AppSidebar.tsx` grouping fix

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

`Bell` stays imported (already imported for this exact icon; only its
usage site moves) — no import list change needed.

### 2. `Messages.tsx` and `Profile.tsx` — add sidebar chrome

Both follow the same shape: import `AppSidebar`, swap the root
`<div className="min-h-screen ...">` for `<AppSidebar>`, swap the matching
closing `</div>` for `</AppSidebar>`. Neither page's `if (!user)` /
`if (!authUser)` early-return block changes — `AppSidebar` has its own
loading/unauthenticated gate, but these pages' own guards run first (inside
the page component, before `AppSidebar` ever mounts) and their fallback UI
is deliberately kept as-is, not replaced by `AppSidebar`'s gate — this
avoids a double-gate flash and preserves each page's specific fallback copy
("Please sign in to access messages." / "Please sign in to view your
profile.").

**Known risk to verify visually:** `Messages.tsx`'s chat layout uses
`h-[calc(100vh-57px)]` (line ~296) to fill the viewport below its own
57px-tall header. Once nested inside `AppSidebar`'s own layout (which adds
its own mobile top bar height on small screens, and `SidebarInset`'s
`<main className="flex-1 p-4">` padding), this fixed calc may cause the
chat column to overflow or leave a gap. This is flagged explicitly for the
verification task to check and fix if needed — not pre-solved here, since
the right adjustment depends on what's actually visible on screen.

### 3. `Notifications.tsx` — swap `NavBar` for `AppSidebar`

Two render branches, both currently wrapping in `<NavBar />`, both get the
same treatment: replace `import NavBar from "@/components/NavBar";` with
`import AppSidebar from "@/components/AppSidebar";`, and in both the
"Access Restricted" branch and the main branch, replace
`<div className="..."><NavBar />` with `<AppSidebar>` and the matching
closing `</div>` with `</AppSidebar>`.

### Error Handling

No new error paths — each page's existing auth/role guards are preserved
exactly. `AppSidebar`'s own loading/unauthenticated states are unreachable
in practice here since these three pages' own guards run first, but that's
harmless (dead code path, not a bug) — matches how Phase 2a's `Dashboard.tsx`
also never actually hits `AppSidebar`'s `loading` branch before its own
data loads, since `useAuth()`'s cache is shared.

### Testing

No unit-testable logic (presentational wrapper swaps), matching the
existing convention. Verification is visual: Puppeteer screenshots of all
three pages (authenticated as both a regular student and, if feasible, a
facilitator/admin account — `Notifications.tsx` is unreachable in any
meaningful way without a facilitator-role test account, so seeding one is
part of this phase's verification, unlike Phase 2a where it was optional)
compared against the existing sidebar visual language, with explicit
attention to the `Messages.tsx` height-calc risk noted above.
