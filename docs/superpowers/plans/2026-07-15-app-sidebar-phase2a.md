# Navigation Chrome Redesign — Phase 2a (App Sidebar + Pilot Migration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real, branded `AppSidebar` component in the Phase 1 "Sagesse Africaine" palette, replacing the dead-code `DashboardLayout.tsx`, and migrate one pilot page (`Dashboard.tsx`) from the marketing `NavBar` to this new sidebar shell.

**Architecture:** The shadcn sidebar primitives (`components/ui/sidebar.tsx`) already exist and already work (proven by the unused-but-functional `DashboardLayout.tsx`). This plan restyles the `--sidebar*` CSS tokens they read, replaces the placeholder menu with real grouped navigation, and swaps one page's layout wrapper. No new UI primitives are built from scratch.

**Tech Stack:** React 19, Tailwind v4 (CSS custom properties), existing shadcn sidebar components, wouter routing.

## Global Constraints

- `AppSidebar` exports the same prop shape as the `DashboardLayout` it replaces: `export default function AppSidebar({ children }: { children: React.ReactNode })`.
- The `LogoMark` SVG component must be reused from `NavBar.tsx` (exported, not duplicated).
- Institution section visibility: `!!user?.institutionId` — exact pattern already used in `client/src/pages/FacilitatorDashboard.tsx:177`.
- Facilitator section visibility: `user?.role === "admin" || user?.role === "superadmin" || user?.role === "facilitator"` — exact pattern already used in `NavBar.tsx`'s user dropdown.
- `DashboardLayout.tsx` is deleted in this plan, not left alongside `AppSidebar.tsx` — there is exactly one sidebar-layout component in the tree after this work.
- `DashboardLayoutSkeleton.tsx` is kept as-is (imported by the new component) — its generic gray skeleton needs no palette changes.
- Only `Dashboard.tsx` is migrated in this plan. No other page's `<NavBar />` usage changes.
- `Footer` is dropped (not carried into `AppSidebar`) for the migrated page — its marketing sitemap links are redundant with the sidebar's own navigation.

---

### Task 1: Sidebar tokens and `LogoMark` export

**Files:**
- Modify: `client/src/index.css:78-85` (`:root` sidebar block) and `client/src/index.css:110-117` (`.dark` sidebar block)
- Modify: `client/src/components/NavBar.tsx:21` (export `LogoMark`)

**Interfaces:**
- Produces: `export function LogoMark({ size = 34 }: { size?: number })` from `NavBar.tsx`, consumed by Task 2's `AppSidebar.tsx`. Redefined `--sidebar*` tokens, consumed automatically by the existing shadcn sidebar primitives (no code change needed in `ui/sidebar.tsx` itself — it already reads these token names).

- [ ] **Step 1: Redefine the `:root` sidebar tokens**

Find (`client/src/index.css:78-85`):

```css
  --sidebar:                    oklch(0.20 0.05 265);
  --sidebar-foreground:         oklch(0.90 0.02 265);
  --sidebar-primary:            oklch(0.70 0.14 270);
  --sidebar-primary-foreground: oklch(0.18 0.05 265);
  --sidebar-accent:             oklch(0.28 0.06 265);
  --sidebar-accent-foreground:  oklch(0.90 0.02 265);
  --sidebar-border:             oklch(0.28 0.04 265);
  --sidebar-ring:               oklch(0.42 0.22 270);
```

Replace with:

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

- [ ] **Step 2: Redefine the `.dark` sidebar tokens**

Find (`client/src/index.css:110-117`):

```css
  --sidebar:                    oklch(0.11 0.04 265);
  --sidebar-foreground:         oklch(0.90 0.02 265);
  --sidebar-primary:            oklch(0.70 0.14 270);
  --sidebar-primary-foreground: oklch(0.13 0.04 265);
  --sidebar-accent:             oklch(0.22 0.06 265);
  --sidebar-accent-foreground:  oklch(0.90 0.02 265);
  --sidebar-border:             oklch(0.24 0.04 265);
  --sidebar-ring:               oklch(0.70 0.14 270);
```

Replace with:

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

(Same values as `:root` — the app has no active theme toggle, so this is
consistency/future-proofing rather than a currently-reachable path.)

- [ ] **Step 3: Export `LogoMark` from `NavBar.tsx`**

Find (`client/src/components/NavBar.tsx:21`):

```tsx
function LogoMark({ size = 34 }: { size?: number }) {
```

Replace with:

```tsx
export function LogoMark({ size = 34 }: { size?: number }) {
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/index.css client/src/components/NavBar.tsx
git commit -m "Restyle sidebar tokens to the Sagesse Africaine palette, export LogoMark"
```

---

### Task 2: `AppSidebar.tsx` (new component, replaces `DashboardLayout.tsx`)

**Files:**
- Create: `client/src/components/AppSidebar.tsx`
- Delete: `client/src/components/DashboardLayout.tsx`

**Interfaces:**
- Consumes: `LogoMark` from `./NavBar` (Task 1), `--sidebar*` tokens (Task 1), `useAuth` from `@/_core/hooks/useAuth`, `getLoginUrl` from `@/const`, the `ui/sidebar.tsx` primitives, `DashboardLayoutSkeleton` from `./DashboardLayoutSkeleton`.
- Produces: `export default function AppSidebar({ children }: { children: React.ReactNode })`, consumed by Task 3's `Dashboard.tsx`.

- [ ] **Step 1: Create `client/src/components/AppSidebar.tsx`**

```tsx
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, CheckCircle2, Compass, BookOpen, GraduationCap,
  Lightbulb, Library, CircleDot, NotebookPen, HeartHandshake, Heart,
  BarChart3, TrendingUp, Shield, FileText, MessageCircle, Bell, User,
  LogOut, PanelLeft,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { LogoMark } from "./NavBar";
import { Button } from "./ui/button";

type NavItem = { icon: typeof LayoutDashboard; label: string; path: string };
type NavSection = { label: string; items: NavItem[] };

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

const INSTITUTION_SECTION: NavSection = {
  label: "Institution",
  items: [
    { icon: BarChart3, label: "Pulse Surveys", path: "/pulse-surveys" },
    { icon: TrendingUp, label: "Team Sentiment", path: "/team-sentiment" },
  ],
};

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

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function AppSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this page requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <AppSidebarContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AppSidebarContent>
    </SidebarProvider>
  );
}

type AppSidebarContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function AppSidebarContent({
  children,
  setSidebarWidth,
}: AppSidebarContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const hasInstitution = !!user?.institutionId;
  const isFacilitator =
    user?.role === "admin" || user?.role === "superadmin" || user?.role === "facilitator";

  const sections: NavSection[] = [
    ...NAV_SECTIONS,
    ...(hasInstitution ? [INSTITUTION_SECTION] : []),
    ...(isFacilitator ? [FACILITATOR_SECTION] : []),
    ACCOUNT_SECTION,
  ];
  const allItems = sections.flatMap((s) => s.items);
  const activeItem = allItems.find((item) => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const initials = (user?.name?.charAt(0) || user?.email?.charAt(0) || "?").toUpperCase();

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <LogoMark size={22} />
                  <span
                    className="truncate text-sidebar-foreground"
                    style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}
                  >
                    HeadCheck
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {sections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className="h-10 transition-all font-normal"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
```

Note on `SidebarInset`'s `<main>`: it wraps `children` with `p-4` padding,
which changes the pilot page's outer spacing slightly compared to its old
`<div className="min-h-screen bg-background">` wrapper. This is
intentional and consistent with how the shadcn sidebar pattern expects
page content to be composed — Task 3's migration keeps the page's own
inner `container max-w-5xl py-8` wrapper, so the visible effect is a small
amount of additional edge padding, not a layout break.

- [ ] **Step 2: Delete the old layout component**

```bash
git rm client/src/components/DashboardLayout.tsx
```

- [ ] **Step 3: Verify**

Run: `npm run check`
Expected: no new errors. (If `DashboardLayoutSkeleton.tsx` or any other
file imports the now-deleted `DashboardLayout.tsx`, this step will catch
it — grep first: `grep -rn "DashboardLayout[^S]" client/src --include=*.tsx`
should return zero matches other than inside `AppSidebar.tsx` itself
before this deletion, confirming nothing else referenced it.)

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AppSidebar.tsx
git commit -m "Add AppSidebar component with real grouped navigation, remove dead DashboardLayout"
```

---

### Task 3: Migrate `Dashboard.tsx` to `AppSidebar`

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `AppSidebar` default export (Task 2).

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

      <div className="container max-w-5xl py-8 space-y-8">
```

Replace with:

```tsx
  return (
    <AppSidebar>
      <div className="hc-gradient-bar h-1.5" />

      <div className="container max-w-5xl py-8 space-y-8">
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
Expected: no new errors — every hook, query, and inner component in
`Dashboard.tsx` is otherwise untouched, so this should be a clean
type-check with no ripple effects.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "Migrate Dashboard.tsx to AppSidebar"
```

---

### Task 4: Visual verification

**Files:** none modified — this task produces screenshots, not code.

**Interfaces:**
- Consumes: the running app from Tasks 1-3, at `/dashboard`.

- [ ] **Step 1: Start the app locally with a real authenticated session**

Phase 1's verification pass could not reach an authenticated page locally
because `server/_core/cookies.ts`'s `getSessionCookieOptions()` always sets
`sameSite: "none"`, which Chrome silently drops without `secure: true` over
plain `http://localhost`. This task needs an authenticated session, so
resolve that first — the simplest fix for local-only verification is a
temporary, uncommitted edit: in `server/_core/cookies.ts`, temporarily
change `sameSite: "none"` to `sameSite: "lax"` for the duration of this
verification pass only. Revert this change (`git checkout --
server/_core/cookies.ts`) before finishing the task — it must never be
committed; it exists only to make cookies work over unencrypted localhost
during this manual check.

Start the app the same way as Phase 1's Task 3 (`headcheck-preview-db`
Docker container + `npm run dev` + a worktree-local `.env` with
`DATABASE_URL` pointing at it and placeholder values for the other
required vars). Register or log in a test account (email/password
registration via `/register` worked for this in Phase 1's verification —
reuse that approach) to reach an authenticated state, then navigate to
`/dashboard`.

- [ ] **Step 2: Capture screenshots**

Using Puppeteer (same pattern as Phase 1's Task 3):
- `/dashboard` — desktop width (1280px), sidebar expanded.
- `/dashboard` — desktop width, sidebar collapsed (click the `PanelLeft`
  toggle button first).
- `/dashboard` — mobile width (390px), confirm the mobile top bar with
  `SidebarTrigger` appears and opens the sidebar as an overlay.
- If the test account has `institutionId` set or a facilitator role
  available, confirm the conditional sections appear — otherwise note
  that only the base sections (Today, Learn & Resources, Support, Account)
  were verified, since seeding an institution-affiliated or facilitator
  test account is out of scope for this check unless it's already easy to
  do with existing data.

- [ ] **Step 3: Compare against the approved mockup**

Check against `docs/superpowers/specs/2026-07-15-app-sidebar-design.md`
and, if the directory still exists,
`.superpowers/brainstorm/9751-1784135921/content/sidebar-structure.html`:
espresso sidebar background, terracotta active-item highlight, Fraunces +
LogoMark branding in the header, grouped section labels, legible cream
text throughout, footer avatar/sign-out dropdown styled with the new
palette (it inherits `--sidebar-*` tokens automatically — confirm this
actually rendered correctly rather than assuming).

- [ ] **Step 4: Fix any visual issues found**

If a screenshot reveals a problem, fix it directly in `AppSidebar.tsx`
(or `Dashboard.tsx` if the issue is specific to the migrated page), re-capture
the affected screenshot, and commit: `git commit -m "Fix visual issues found in sidebar verification pass"`.

- [ ] **Step 5: Confirm cleanup and report**

Confirm the temporary `cookies.ts` edit from Step 1 was reverted
(`git status` / `git diff --stat` show nothing for that file). No other
commit is needed for this task unless Step 4 found something. Summarize
what was checked and confirmed.
