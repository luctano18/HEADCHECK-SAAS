# Navigation Chrome Redesign — Phase 2a: App Sidebar + Pilot Migration

**Date:** 2026-07-15
**Status:** Approved

## Context

Phase 1 (already shipped) re-skinned the marketing `NavBar.tsx` in the
"Sagesse Africaine" espresso/terracotta direction. That spec's "Phase 2"
section described moving the *authenticated app* off the horizontal navbar
entirely and onto a sidebar, reusing the shadcn sidebar primitives already
present in `client/src/components/ui/sidebar.tsx` — present in the codebase
but, as of Phase 1, unused by any route (`DashboardLayout.tsx`, which wires
those primitives together, has zero page imports; its menu items are
literally placeholder `"Page 1"` / `"Page 2"` entries).

This full migration is large — roughly 19 authenticated routes currently
render `<NavBar />` directly. Migrating all of them with fully-specified,
no-placeholder code in a single plan would be enormous. This spec covers
**Phase 2a only**: build the real `AppSidebar` component and migrate one
pilot page (`Dashboard.tsx`, the highest-traffic authenticated page) to
prove the pattern end-to-end. Phases 2b onward will migrate the remaining
pages in batches, reusing the exact pattern this phase establishes — each
gets its own brainstorm-lite/plan cycle rather than being pre-specified
here.

Explored visually with the user: a mockup showing two sidebar states (a
general student view and a facilitator-with-institution view), with pages
grouped into sections — approved as-is, including collapsing "Violence
Prevention" into the "Crisis Support" nav entry (both are safety pages;
listing both separately in the sidebar was judged redundant).

## Scope

In scope for Phase 2a:
- Redefine the existing `--sidebar*` CSS tokens (already present in
  `client/src/index.css`, currently an unused indigo-dark palette) to the
  espresso/terracotta direction, referencing the `--hc-*` tokens Phase 1
  added rather than duplicating raw oklch values.
- New `client/src/components/AppSidebar.tsx`, adapted from the existing
  `DashboardLayout.tsx` (which is deleted as part of this phase — it's
  dead code being replaced, not two competing layouts left in the tree).
- Real, grouped navigation content: "Today" (Dashboard, Check-In, Compass),
  "Learn & Resources" (Resources, Learn EI, Mindset, AIEI Library, Feeling
  Wheel), "Support" (Wellness Log, Support Options, Crisis Support —
  Violence Prevention reached via Crisis Support, not a separate entry),
  "Institution" (Pulse Surveys, Team Sentiment — shown only when
  `user.institutionId` is set), "Facilitator" (Facilitator Dashboard,
  Weekly Report — shown only when `role` is `admin`, `superadmin`, or
  `facilitator`), "Account" (Messages, Notifications, Profile).
- HeadCheck branding in the sidebar header: the `LogoMark` SVG + Fraunces
  wordmark from Phase 1 (imported from `NavBar.tsx`, not duplicated).
- Migrate `Dashboard.tsx` (only) from `<NavBar />` + `<Footer />` to
  `<AppSidebar>`. This establishes the literal find/replace pattern every
  later batch will repeat.

Out of scope for Phase 2a:
- Migrating any page other than `Dashboard.tsx` — that's Phase 2b+.
- Fixing the pre-existing lack of role enforcement on `PulseSurveys`/
  `TeamSentiment` (flagged to the user during brainstorming as a possible
  gap; explicitly not part of this design).
- `DashboardLayoutSkeleton.tsx` — its neutral gray loading placeholder
  doesn't need to match the final espresso palette; left as-is.
- Resizable sidebar width dragging — `DashboardLayout.tsx` had this
  feature built in (mouse-drag resize, persisted to `localStorage`).
  Carried forward as-is in the adapted `AppSidebar.tsx` since it's already
  working, self-contained logic — not re-designed, not removed.

## Design

### 1. Sidebar tokens (`client/src/index.css`)

Replace the existing `--sidebar*` block in `:root` (currently 8 lines of
indigo-dark oklch values, unused) with references to the Phase 1 tokens:

```css
--sidebar:                    var(--hc-espresso);
--sidebar-foreground:         var(--hc-cream);
--sidebar-primary:            var(--hc-terracotta);
--sidebar-primary-foreground: var(--hc-espresso-deep);
--sidebar-accent:             oklch(0.28 0.05 50);
--sidebar-accent-foreground:  var(--hc-cream);
--sidebar-border:             oklch(0.30 0.04 50);
--sidebar-ring:               var(--hc-terracotta);
```

Same replacement in the `.dark { }` block (currently a separate, slightly
different indigo-dark set) — the app has no active theme toggle
(`ThemeProvider defaultTheme="light"`, not switchable), so this is
consistency/future-proofing, not a currently-reachable code path.

`--sidebar-accent` and `--sidebar-border` are new standalone oklch values
(a slightly lighter warm brown than `--hc-espresso` for hover/active
states, and a subtle warm border) rather than references to existing `hc-*`
tokens, because no existing token was the right lightness for these two
roles — they're new but follow the same hue family (50, matching
`--hc-ocre`'s 45/35 range).

### 2. `AppSidebar.tsx` (new file, replaces `DashboardLayout.tsx`)

Structure carried over from `DashboardLayout.tsx` almost unchanged
(`SidebarProvider` wrapper, resizable width via `localStorage`, collapsible
icon mode, mobile top bar with `SidebarTrigger`, footer user-menu with
avatar + sign-out dropdown) — only the header branding and the menu content
change:

**Header** (`SidebarHeader`): replaces the "Navigation" text label with the
`LogoMark` SVG (imported from `NavBar.tsx`, exported from there for reuse —
see Interfaces below) and a Fraunces "HeadCheck" wordmark, matching Phase
1's marketing navbar branding. The existing collapse-toggle button
(`PanelLeft` icon) is kept as-is.

**Menu content** (`SidebarContent`): six `SidebarGroup` blocks (using the
already-available `SidebarGroup`/`SidebarGroupLabel`/`SidebarGroupContent`
primitives from `ui/sidebar.tsx` — exported but unused by the current
`DashboardLayout.tsx`, which only uses the non-grouped `SidebarMenu`
directly):

```tsx
const NAV_SECTIONS = [
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

const INSTITUTION_SECTION = {
  label: "Institution",
  items: [
    { icon: BarChart3, label: "Pulse Surveys", path: "/pulse-surveys" },
    { icon: TrendingUp, label: "Team Sentiment", path: "/team-sentiment" },
  ],
};

const FACILITATOR_SECTION = {
  label: "Facilitator",
  items: [
    { icon: Shield, label: "Facilitator Dashboard", path: "/facilitator" },
    { icon: FileText, label: "Weekly Report", path: "/admin/weekly-report" },
  ],
};

const ACCOUNT_SECTION = {
  label: "Account",
  items: [
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
};
```

Rendering logic: always render `NAV_SECTIONS` and `ACCOUNT_SECTION`.
Render `INSTITUTION_SECTION` only when `user?.institutionId` is truthy
(matching the exact pattern already used in `FacilitatorDashboard.tsx:177`:
`const hasInstitution = !!user?.institutionId`). Render
`FACILITATOR_SECTION` only when
`user?.role === "admin" || user?.role === "superadmin" || user?.role === "facilitator"`
(matching the exact role-check pattern already used in `NavBar.tsx`'s user
dropdown). Each section is one `SidebarGroup` with a `SidebarGroupLabel`
and a `SidebarMenu` of `SidebarMenuButton`s, `isActive` computed the same
way `DashboardLayout.tsx` already does (`location === item.path`).

**Footer** (`SidebarFooter`): unchanged from `DashboardLayout.tsx` — avatar
+ name/email + dropdown with sign-out. No design changes needed here; it
already uses the shadcn `--sidebar-*` tokens this spec redefines, so it
inherits the new palette automatically.

**Deletion:** `DashboardLayout.tsx` and its only-ever-placeholder
`menuItems` array are deleted, replaced entirely by `AppSidebar.tsx`.
`DashboardLayoutSkeleton.tsx` is kept (imported by the new component the
same way `DashboardLayout.tsx` imported it) since its generic gray skeleton
doesn't need any palette-specific changes.

### 3. Interfaces

- `AppSidebar.tsx` exports `export default function AppSidebar({ children }: { children: React.ReactNode })` —
  same prop shape as the `DashboardLayout` it replaces, so the migration
  in each page is a pure import-and-wrap swap.
- `NavBar.tsx` gains `export function LogoMark(...)` (currently
  module-private) so `AppSidebar.tsx` can import
  `{ LogoMark } from "./NavBar"` instead of duplicating the SVG.

### 4. Pilot migration: `Dashboard.tsx`

Find (the page's current top-level structure, `client/src/pages/Dashboard.tsx`):

```tsx
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
```

```tsx
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />

      <div className="container max-w-5xl py-8 space-y-8">
        {/* ...existing page content, unchanged... */}
      </div>
    </div>
  );
```

(the closing structure, near the bottom of the file):

```tsx
      <Footer />
    </div>
  );
```

Replace with:

```tsx
import AppSidebar from "@/components/AppSidebar";
```

```tsx
  return (
    <AppSidebar>
      <div className="hc-gradient-bar h-1.5" />

      <div className="container max-w-5xl py-8 space-y-8">
        {/* ...existing page content, unchanged... */}
      </div>
    </AppSidebar>
  );
```

```tsx
    </AppSidebar>
  );
```

No other line in `Dashboard.tsx` changes — every hook, query, and inner
component stays exactly as it is today. `Footer` is dropped (not carried
into `AppSidebar`) — it's a marketing sitemap-style footer
(`Explore`/`Learn`/`For Organizations` link columns) whose content is
already covered by the sidebar's own navigation, redundant inside the app
shell.

### Error Handling

`AppSidebar` inherits `DashboardLayout.tsx`'s existing handling: a loading
skeleton while `useAuth()` resolves, and an inline "Sign in to continue"
prompt (using the already-fixed `getLoginUrl()`, which falls back to
`/login`) if `useAuth()` resolves with no user. No new error paths
introduced.

### Testing

No unit-testable logic (presentational component + one page's wrapper
swap), matching this repo's existing frontend-test-free convention.
Verification is visual: Puppeteer screenshots of `/dashboard` (expanded and
collapsed sidebar states, desktop and mobile widths, using a real
authenticated session this time — Phase 1's verification pass hit a
localhost-cookie limitation for authenticated pages; the pilot task should
either resolve that locally or explicitly attempt Phase 1's workaround
before falling back to a code-only review) compared against the approved
`sidebar-structure.html` mockup.
