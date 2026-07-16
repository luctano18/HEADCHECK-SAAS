# Sidebar Migration — Phase 2d: Facilitator Dashboard Design

## Context

Phases 2a-2c migrated authenticated pages from the top `NavBar` to the
persistent `AppSidebar` layout. Phase 2c deliberately excluded
`FacilitatorDashboard.tsx` (1,413 lines):

> `FacilitatorDashboard.tsx` (1,413 lines) is deliberately excluded — its
> size warrants a dedicated phase (2d) rather than folding it into this
> batch.

Unlike the pages migrated so far, `FacilitatorDashboard.tsx` never used
`NavBar`. It has always rendered its own bespoke sidebar: logo, a 9-item
nav (which doubles as this page's internal tab switcher), a
"My Personal Dashboard" quick-switch button, and a user footer with
sign-out — all of which `AppSidebar` already provides at the app level.

This is not a pure wrapper swap. `AppSidebar` already lists a
"Facilitator Dashboard" link (in `FACILITATOR_SECTION`), so today, a
facilitator navigating there from any already-migrated page gets yanked
out of the `AppSidebar` shell into this page's own separate layout — the
same jarring layout-switch problem Phase 2c fixed for other pages.

## Scope

In scope:
- `FacilitatorDashboard.tsx`: replace the bespoke `<aside>` + custom
  `flex h-screen overflow-hidden` shell with `<AppSidebar>`.
- Replace the internal 9-tab switcher (currently the `<aside>`'s nav,
  duplicated as an icon-only row in the mobile header) with a horizontal
  pill tab bar at the top of the content area.
- Remove the "My Personal Dashboard" quick-switch button (redundant with
  `AppSidebar`'s own "Dashboard" link).
- Fix inconsistent content width: wrap all 9 tab bodies in one
  `max-w-5xl` container instead of the current partial wrapper that
  closes after 6 of 9 tabs, leaving `eeis`, the overview export buttons,
  `pulse`, and `sentiment` either unconstrained or independently padded.

Out of scope:
- Any change to `AppSidebar.tsx` itself — it already lists the
  `/facilitator` link; no new logic needed there.
- Splitting `FacilitatorDashboard.tsx` into per-tab sub-components. It
  stays a single file/component, matching the "wrapper swap, not a
  refactor" pattern of 2a-2c.
- Removing the `pulse`/`sentiment` tabs despite overlapping with the
  standalone `/pulse-surveys` and `/team-sentiment` pages — explicitly
  kept as-is (decided during brainstorming).
- Any tRPC/data-fetching/business-logic change. Pure layout migration.

## Design

### 1. Outer layout swap

Current root (lines 282-284, closing 1409-1412):
```tsx
return (
  <div className="min-h-screen bg-background">
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 ...">...</aside>
      <main className="flex-1 overflow-y-auto">...</main>
    </div>
  </div>
);
```

New root:
```tsx
return (
  <AppSidebar>
    <div className="max-w-5xl mx-auto space-y-8">
      {/* pill tab bar, then the 9 tab bodies */}
    </div>
  </AppSidebar>
);
```

Add `import AppSidebar from "@/components/AppSidebar";` to the top of
the file. `AppSidebar` already wraps children in
`<SidebarInset><main className="flex-1 p-4">{children}</main></SidebarInset>`
(see `AppSidebar.tsx:326`), so the page no longer needs its own
`min-h-screen`/`overflow-y-auto` scaffolding.

The loading-state early return (lines 221-227,
`<div className="min-h-screen flex items-center justify-center ...">`)
stays as-is — `AppSidebar` itself only takes over once its own auth
check resolves; this page's `loading` state (its own tRPC query state,
distinct from auth loading) still needs a standalone full-viewport
spinner state before the sidebar shell would make sense.

### 2. Delete the bespoke `<aside>` and mobile header

Remove entirely:
- The `<aside className="w-64 ...">` block (lines 285-341): logo, badge,
  `TABS.map` nav, "My Personal Dashboard" button, user footer + sign-out.
- The mobile header block (lines 346-369): duplicate icon-only
  `TABS.map` row and its own "My Personal Dashboard" icon button.
  `AppSidebar` already renders its own mobile top bar with a
  `SidebarTrigger` (`AppSidebar.tsx:312-325`).

`logout` (from `useAuth`) and `navigate("/dashboard")` calls tied to the
now-deleted sign-out/quick-switch buttons are removed along with them.
If `logout` or `Home`/`LogOut` icon imports become unused as a result,
remove those imports too.

### 3. Horizontal pill tab bar (replaces the 9-tab nav)

Insert directly above the tab bodies, inside the `max-w-5xl` wrapper:

```tsx
<div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
  {TABS.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id as any)}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        activeTab === tab.id
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {tab.icon}
      {tab.label}
      {tab.badge ? (
        <span className="w-4.5 h-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold px-1">
          {tab.badge}
        </span>
      ) : null}
    </button>
  ))}
</div>
```

`TABS` (lines 270-280) is unchanged — same 9 entries, same icons, same
`badge` values. Only its consumer changes from a vertical nav list to a
horizontal pill row. Colors use semantic `bg-foreground`/`bg-muted`
tokens (matching the rest of the page's existing `Card`/`Badge` usage,
which is already on the light/card theme, not the espresso navbar
theme) rather than the `sidebar-*` tokens the old `<aside>` used, since
this bar now lives in the light content area, not a dark rail.

`overflow-x-auto` handles narrow viewports without needing a separate
mobile-only rendering — one bar serves both desktop and mobile, removing
the duplicate icon-row that existed before.

### 4. Uniform `max-w-5xl` wrapper

Currently:
```tsx
<div className="p-6 md:p-8 space-y-8 max-w-5xl">
  {/* overview, alerts, violence, groupRisk, groups, assigned */}
</div>
{/* eeis — no wrapper */}
{/* pulse — own <div className="p-6 space-y-6"> */}
{/* export buttons (overview) — no wrapper */}
{/* sentiment — own <div className="p-6 space-y-6"> */}
```

New: one wrapper spans all 9 tab bodies plus the export-buttons block
(the outer `max-w-5xl mx-auto space-y-8` div from Section 1's root
JSX already provides this — `AppSidebar`'s own `p-4` on `<main>`
supplies the outer page padding, so the inner wrapper drops the
`p-6 md:p-8` and keeps just `max-w-5xl mx-auto space-y-8`). The `pulse`
and `sentiment` tabs' own `<div className="p-6 space-y-6">` wrappers are
replaced with a plain fragment (`<>...</>`), matching how `eeis` and the
other tabs already render — avoiding doubled padding now that the outer
wrapper covers all of them.

### 5. Unchanged

- `TABS` array, `activeTab` state, all 27 tRPC calls, all tab body JSX
  content (cards, charts, forms) — untouched.
- `EmployeeResourcesPanel` sub-component — untouched.
- `pulse` and `sentiment` tabs stay, despite overlapping with
  `/pulse-surveys` and `/team-sentiment` — explicit decision, not an
  oversight.

## Testing

No new business logic, so no new unit tests. Verification is visual:
`npm run check` (TypeScript) plus a Puppeteer pass confirming:
- `/facilitator` renders inside the `AppSidebar` shell (sidebar visible,
  "Facilitator Dashboard" highlighted as active).
- The pill tab bar shows all 9 tabs with correct badge counts, and
  clicking a pill switches `activeTab` correctly.
- No layout jump when navigating from another `AppSidebar` page (e.g.
  `/dashboard`) to `/facilitator` and back.
- All 9 tab bodies render at consistent width or without visible
  double-padding.

`npm test` (existing 169 tests) must still pass — no business logic
touched, so no regressions expected there.
