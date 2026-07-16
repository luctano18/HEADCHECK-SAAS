# Sidebar Migration Phase 2d Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `FacilitatorDashboard.tsx` from its bespoke sidebar/layout to the shared `AppSidebar` shell, replacing its internal 9-tab nav with a horizontal pill tab bar, and fixing the page's inconsistent content-width wrapping.

**Architecture:** Single-file JSX restructuring. No new components, no data/logic changes. `AppSidebar` (already built, already lists `/facilitator`) takes over the outer chrome; the page keeps its own `activeTab` state and tab bodies, just re-skins the tab switcher and unifies the content wrapper.

**Tech Stack:** React 19, wouter, tRPC, Tailwind v4, lucide-react icons.

## Global Constraints

- No change to `AppSidebar.tsx`, tRPC procedures, or any business logic.
- `pulse` and `sentiment` tabs stay in the file as-is (not removed), per design spec.
- The file stays a single component — no splitting into per-tab sub-components.
- `TABS` array (icons, labels, badge values) is reused unchanged — only its consumer JSX changes from vertical nav to horizontal pill bar.
- Reference spec: `docs/superpowers/specs/2026-07-16-sidebar-phase2d-design.md`.

---

### Task 1: Migrate FacilitatorDashboard to AppSidebar with pill tab bar

**Files:**
- Modify: `client/src/pages/FacilitatorDashboard.tsx`

**Interfaces:**
- Consumes: `AppSidebar` from `@/components/AppSidebar` — `export default function AppSidebar({ children }: { children: React.ReactNode })`, already exists, no changes needed.
- Produces: nothing new consumed by other files — `FacilitatorDashboard` remains the default export routed at `/facilitator` in `client/src/App.tsx` (unchanged).

This task is not meaningfully splittable: the aside deletion, the pill-bar
addition, and the wrapper-width fix all touch the same ~1,130-line JSX
return block and leave the page non-functional if applied in isolation
(e.g. deleting the aside without adding the pill bar removes the only
way to switch tabs). Treat it as one task with multiple sequential edits
inside the same file.

- [ ] **Step 1: Update the icon imports — drop icons that become unused, no new icons needed**

Current (`client/src/pages/FacilitatorDashboard.tsx:12-15`):
```tsx
import {
  Brain, Users, AlertTriangle, TrendingUp, Plus, LogOut, User,
  Mail, Shield, BarChart3, Building2, Copy, Loader2, Home, Heart, Settings, Sliders, Download
} from "lucide-react";
```

New:
```tsx
import {
  Brain, Users, AlertTriangle, TrendingUp, Plus,
  Mail, Shield, BarChart3, Copy, Loader2, Heart, Settings, Sliders, Download
} from "lucide-react";
```

`LogOut`, `User`, `Building2`, and `Home` are only used inside the bespoke
`<aside>` and mobile header being deleted in Step 3 — confirmed via
`grep -n "<LogOut\|<User\b\|<Building2\|<Home" client/src/pages/FacilitatorDashboard.tsx`
returning only those deleted lines. `Brain` stays — it's also used in the
loading-state spinner at line 224, untouched by this task. `Shield` stays
— it's also used in the `TABS` array (`violence` tab icon) and is a route
guard concern, not layout.

Add the `AppSidebar` import directly below the existing component imports,
matching the convention used in `client/src/pages/Dashboard.tsx:14`:

Current (`client/src/pages/FacilitatorDashboard.tsx:1-11`):
```tsx
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
```

New:
```tsx
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
```

- [ ] **Step 2: Drop `logout` from the `useAuth()` destructure**

Current (`client/src/pages/FacilitatorDashboard.tsx:103`):
```tsx
  const { user, isAuthenticated, loading, logout } = useAuth();
```

New:
```tsx
  const { user, isAuthenticated, loading } = useAuth();
```

`logout` is only called from the bespoke sidebar's sign-out button
(current line 337), which Step 3 deletes — `AppSidebar` already renders
its own sign-out control. Confirm via
`grep -n "logout" client/src/pages/FacilitatorDashboard.tsx` that the
only other match is the destructure itself before making this edit.

- [ ] **Step 3: Replace the aside + mobile header + tab-nav opening with `AppSidebar` and a pill tab bar**

Current (`client/src/pages/FacilitatorDashboard.tsx:282-372`, the full
block from the return statement through the start of the tab-body
wrapper div):
```tsx
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border hidden md:flex">
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">HeadCheck <span className="text-sidebar-primary">AI</span></span>
            </div>
            <Badge className="mt-2 text-xs bg-sidebar-accent text-sidebar-accent-foreground">
              <Building2 className="w-3 h-3 mr-1" /> {isSuperadmin ? "Super Admin" : "Facilitator View"}
            </Badge>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                {tab.icon}
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge ? (
                  <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
            <div className="pt-2 border-t border-sidebar-border mt-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/30 border border-emerald-700/30 transition-colors"
              >
                <Home className="w-4 h-4" /> My Personal Dashboard
              </button>
            </div>
          </nav>
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "Facilitator"}</p>
                <p className="text-xs text-sidebar-foreground/50">{isSuperadmin ? "Super Admin" : "Facilitator"}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header */}
          <div className="md:hidden border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="container flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Facilitator Dashboard</span>
              </div>
              <div className="flex gap-1 items-center">
                {TABS.map((t) => (
                  <Button key={t.id} variant={activeTab === t.id ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(t.id as any)}>
                    {t.icon}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="text-emerald-400 hover:text-emerald-200 px-2"
                  title="My Personal Dashboard"
                >
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 max-w-5xl">
```

New:
```tsx
  return (
    <AppSidebar>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Tab switcher — horizontal pill bar, replaces the old vertical
            sidebar nav now that AppSidebar owns the persistent left rail. */}
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

        <div className="space-y-8">
```

Notes on this edit:
- `isSuperadmin` is still used elsewhere in the file (group-creation
  disabled-state checks) — only its two usages inside the deleted
  `<aside>` (the badge label and the footer role text) go away. No
  further changes needed to the `isSuperadmin` declaration itself.
- The new wrapper nests two divs: the outer `max-w-5xl mx-auto space-y-8`
  (page-level width + gap between the pill bar and the tab-body area),
  and an inner `space-y-8` (gap between whichever tab bodies render,
  matching the original `space-y-8` on the old single wrapper). Step 4
  closes both.

- [ ] **Step 4: Unify the tab-body wrapper — one `</div></div>` at the end instead of the old partial-wrapper + two duplicate `p-6 space-y-6` divs**

Four separate edits inside the tab-body region, all within the same
return statement as Step 3:

**4a.** Where the old wrapper closed early (`client/src/pages/FacilitatorDashboard.tsx:1035-1038`, right after the `assigned` tab and right before the `eeis` tab comment) — remove the premature close so `eeis` stays inside the wrapper:

Current:
```tsx
          </div>

            {/* ── EEIS: Intervention Config Tab ── */}
            {activeTab === "eeis" && (
```

New:
```tsx

            {/* ── EEIS: Intervention Config Tab ── */}
            {activeTab === "eeis" && (
```

**4b.** Pulse tab's own padding wrapper becomes a fragment
(`client/src/pages/FacilitatorDashboard.tsx:1196-1197` and the matching
close at `1290-1291`):

Current (open, line 1196-1197):
```tsx
            {activeTab === "pulse" && (
              <div className="p-6 space-y-6">
```
New:
```tsx
            {activeTab === "pulse" && (
              <>
```

Current (close, line 1290-1291):
```tsx
              </div>
            )}
```
New (this is the close for the `pulse` block specifically — locate it via the surrounding `{/* Employee Wellness Resources */}` / `<EmployeeResourcesPanel />` context immediately above, since the same `</div>\n            )}` text also appears elsewhere in the file):
```tsx
              </>
            )}
```

**4c.** Sentiment tab's own padding wrapper becomes a fragment
(`client/src/pages/FacilitatorDashboard.tsx:1347-1348` and the matching
close at `1406-1407`):

Current (open, line 1347-1348):
```tsx
            {activeTab === "sentiment" && (
              <div className="p-6 space-y-6">
```
New:
```tsx
            {activeTab === "sentiment" && (
              <>
```

Current (close, line 1406-1407, identify via the preceding Daily Intensity
Trend `<Card>` block closing immediately above — the last content in the
file before this point):
```tsx
              </div>
            )}
```
New:
```tsx
              </>
            )}
```

**4d.** Close the two wrapper divs opened in Step 3, replacing the old
end-of-file closing tags
(`client/src/pages/FacilitatorDashboard.tsx:1408-1413`):

Current:
```tsx

        </main>
      </div>
    </div>
  );
}
```

New:
```tsx
        </div>
      </div>
    </AppSidebar>
  );
}
```

- [ ] **Step 5: Run the TypeScript check**

Run: `npm run check`
Expected: no errors. In particular, confirm no "declared but never read"
errors for `logout`, `Home`, `LogOut`, `Building2`, `User` (Steps 1-2
should have already removed all of these), and no JSX fragment mismatch
errors (Step 4's `<div>...</div>` → `<>...</>` swaps must pair correctly
— an unclosed fragment or leftover `</div>` will surface here first).

- [ ] **Step 6: Run the existing test suite**

Run: `npm test`
Expected: 169/169 tests pass (same count as before this change — no
business logic touched, so no test file needs updating).

- [ ] **Step 7: Visual verification**

Apply the repo's established temporary local-testing overrides (CSP
disabled, rate limit raised — see any prior phase's verification notes)
to `server/_core/index.ts`, start the dev server, and use Puppeteer (or
manual browser interaction) to confirm, then revert those temporary
overrides before finishing:
- `/facilitator` renders inside the `AppSidebar` shell — the persistent
  left rail is visible with "Facilitator Dashboard" shown as the active
  item.
- The pill tab bar renders all 9 tabs with correct icons and badge
  counts (compare against live data — e.g. if there are unacknowledged
  crisis alerts, the "Crisis Alerts" pill shows a matching badge).
- Clicking each pill switches `activeTab` and renders that tab's body
  with no visible double-padding or width inconsistency (spot-check at
  least `overview`, `eeis`, `pulse`, and `sentiment` — the four tabs
  whose wrapping changed in Step 4).
- Navigating from another `AppSidebar` page (e.g. `/dashboard`) to
  `/facilitator` produces no layout flash/jump.
- No "My Personal Dashboard" button is present anywhere on the page.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/FacilitatorDashboard.tsx
git commit -m "$(cat <<'EOF'
Migrate FacilitatorDashboard to AppSidebar, replace tab nav with pill bar

Completes the sidebar migration (Phase 2d), deferred from Phase 2c due
to this file's size. The page had its own bespoke sidebar duplicating
AppSidebar's chrome, which also caused a jarring layout switch when
navigating here from any already-migrated page. The bespoke sidebar's
9-tab nav becomes a horizontal pill bar; content-width wrapping is
unified across all 9 tabs instead of the previous partial wrapper.
EOF
)"
```
