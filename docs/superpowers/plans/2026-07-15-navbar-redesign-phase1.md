# Navigation Chrome Redesign — Phase 1 (Marketing Navbar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the marketing `NavBar.tsx` in the approved "Sagesse Africaine" direction (espresso/terracotta/ocre palette, Fraunces + Public Sans typography, inline SVG logomark) without changing its structure, links, or behavior.

**Architecture:** New CSS custom properties added alongside the existing design tokens (nothing removed or renamed). `NavBar.tsx` is edited in place — same component, same JSX tree, same 10 nav links, same interactive logic — only color/font values change, plus one new small `LogoMark` sub-component replacing the external image.

**Tech Stack:** React 19, Tailwind v4 (CSS custom properties via `@theme inline`), no new dependencies.

## Global Constraints

- No changes to page content, buttons, or cards outside `NavBar.tsx` — the rest of the app keeps its current indigo/coral palette (`--primary`, `--accent`, etc. are untouched).
- No changes to the 10-item link list, its order, labels, or routes.
- No changes to interactive behavior: dropdown menu, mobile hamburger drawer, messages icon, notification bell, progress widget must work exactly as before — only their colors/fonts change.
- **Popup/dropdown content panels stay in their current light styling, unchanged**: the notification bell dropdown and the step-summary panel (progress widget's expandable detail view) are both content surfaces, not navigation chrome — leave every color in those two blocks exactly as-is. Everything else in the file (the bar itself, the mobile drawer, the user account dropdown menu, all trigger buttons/icons/text sitting directly in the bar) gets the new palette.
- Semantic/functional colors are never re-skinned: the unread-count red badges (`oklch(0.55 0.22 25)`) and the destructive-red "Sign Out" menu item stay exactly as they are — they signal state, not brand.
- New tokens use the exact names and values from the spec (`docs/superpowers/specs/2026-07-15-navbar-redesign-design.md`): `--hc-espresso`, `--hc-espresso-deep`, `--hc-terracotta`, `--hc-ocre`, `--hc-cream`, `--hc-cream-muted`.
- Fraunces is used only for the logo wordmark. Public Sans is the nav's link/label font. Neither replaces Inter/Playfair Display elsewhere in the app.

---

### Task 1: Design tokens and font loading

**Files:**
- Modify: `client/src/index.css:6-78` (the `:root` block)
- Modify: `client/index.html:26` (the Google Fonts link)

**Interfaces:**
- Produces: six new CSS custom properties (`--hc-espresso`, `--hc-espresso-deep`, `--hc-terracotta`, `--hc-ocre`, `--hc-cream`, `--hc-cream-muted`), and the `Fraunces`/`Public Sans` font families loaded and available globally — both consumed by Task 2's `NavBar.tsx` edits.

- [ ] **Step 1: Add the new tokens to `client/src/index.css`**

Find this block (currently lines 30-33):

```css
  /* Soft teal — accents for progress and support moments */
  --hc-teal:           oklch(0.65 0.09 195);
  --hc-teal-light:     oklch(0.92 0.04 195);
  --hc-teal-deep:      oklch(0.45 0.11 195);
```

Add immediately after it (before the `/* Legacy aliases kept for backward compat */` comment):

```css
  /* Navigation chrome — "Sagesse Africaine" direction (navbar/sidebar only,
     not used by page content, buttons, or cards) */
  --hc-espresso:       oklch(0.22 0.03 55);
  --hc-espresso-deep:  oklch(0.16 0.03 55);
  --hc-terracotta:     oklch(0.60 0.14 45);
  --hc-ocre:           oklch(0.50 0.13 35);
  --hc-cream:          oklch(0.95 0.02 75);
  --hc-cream-muted:    oklch(0.75 0.05 65);
```

- [ ] **Step 2: Extend the Google Fonts link in `client/index.html`**

Find (line 26):

```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
```

Replace with:

```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Fraunces:wght@600;700&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Verify**

Run: `npm run check`
Expected: no errors (this task only touches CSS/HTML, `tsc` should be unaffected, but running it confirms nothing else broke).

Start the dev server (`npm run dev`) and open the app in a browser. Open devtools, inspect the `<html>` element's computed styles, confirm `--hc-terracotta` etc. resolve to real color values (not `unset`). Confirm the Network tab shows the Google Fonts CSS request includes `Fraunces` and `Public+Sans` in its query string.

- [ ] **Step 4: Commit**

```bash
git add client/src/index.css client/index.html
git commit -m "Add navigation-chrome design tokens and Fraunces/Public Sans fonts"
```

---

### Task 2: Restyle `NavBar.tsx`

**Files:**
- Modify: `client/src/components/NavBar.tsx` (entire file — every inline `oklch()` color value and the logo image)

**Interfaces:**
- Consumes: the six tokens and two font families from Task 1.
- Produces: no new exports — `NavBar` remains the default export with the same props (none) and same behavior.

This task is a systematic find-and-replace across the file. Apply every edit below. The file's structure, JSX nesting, event handlers, and conditional rendering are otherwise untouched — only the values shown change.

- [ ] **Step 1: Add the `LogoMark` component**

Add this above the `NAV_LINKS` array (near the top of the file, after the imports):

```tsx
function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="var(--hc-terracotta)" strokeWidth="1.4" opacity="0.5" />
      <path d="M20 6 L31 20 L20 34 L9 20 Z" fill="none" stroke="var(--hc-terracotta)" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="5.5" fill="var(--hc-terracotta)" />
    </svg>
  );
}
```

- [ ] **Step 2: Restyle the `<nav>` root element**

Find:

```tsx
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b"
      style={{ borderColor: "oklch(0.92 0.03 260)" }}
      role="navigation"
      aria-label="Main navigation"
    >
```

Replace with:

```tsx
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
      style={{
        backgroundColor: "var(--hc-espresso)",
        borderColor: "color-mix(in oklch, var(--hc-terracotta) 25%, transparent)",
        fontFamily: "'Public Sans', sans-serif",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
```

- [ ] **Step 3: Restyle the logo button**

Find:

```tsx
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-black text-xl flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          style={{ color: "oklch(0.42 0.22 270)" }}
          aria-label="HeadCheck — Back to home"
        >
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663198457005/2dnC5dXijMKhtVCChhUvdN/headcheck-logo-final_d8b554b8.png"
            alt="HeadCheck logo"
            className="w-8 h-8 rounded-md object-contain"
          />
          <span>HeadCheck</span>
        </button>
```

Replace with:

```tsx
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xl flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          style={{ color: "var(--hc-cream)" }}
          aria-label="HeadCheck — Back to home"
        >
          <LogoMark />
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>HeadCheck</span>
        </button>
```

- [ ] **Step 4: Restyle the desktop nav links**

Find:

```tsx
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                style={{
                  background: isActive(link.href) ? "oklch(0.94 0.04 270)" : "transparent",
                  color: isActive(link.href) ? "oklch(0.42 0.22 270)" : "oklch(0.40 0.04 260)",
                }}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </button>
```

Replace with:

```tsx
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                style={{
                  background: isActive(link.href)
                    ? "color-mix(in oklch, var(--hc-terracotta) 18%, transparent)"
                    : "transparent",
                  color: isActive(link.href) ? "var(--hc-cream)" : "var(--hc-cream-muted)",
                }}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </button>
```

- [ ] **Step 5: Restyle the `ProgressWidget` sub-component**

Find:

```tsx
      {/* Journey label */}
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{ color: "oklch(0.42 0.22 270)" }}
      >
        {progress.label}
      </span>

      {/* Progress track */}
      <div
        className={["rounded-full overflow-hidden flex-1", mobile ? "h-1.5" : "h-2"].join(" ")}
        style={{ background: "oklch(0.93 0.03 285)" }}
        role="progressbar"
        aria-valuenow={progress.current}
        aria-valuemin={0}
        aria-valuemax={progress.total}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: progress.color }}
        />
      </div>

      {/* Step counter */}
      <span
        className="text-xs font-medium whitespace-nowrap tabular-nums"
        style={{ color: "oklch(0.40 0.04 260)" }}
      >
        {progress.current}/{progress.total}
      </span>
```

Replace with:

```tsx
      {/* Journey label */}
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{ color: "var(--hc-terracotta)" }}
      >
        {progress.label}
      </span>

      {/* Progress track */}
      <div
        className={["rounded-full overflow-hidden flex-1", mobile ? "h-1.5" : "h-2"].join(" ")}
        style={{ background: "color-mix(in oklch, var(--hc-cream) 15%, transparent)" }}
        role="progressbar"
        aria-valuenow={progress.current}
        aria-valuemin={0}
        aria-valuemax={progress.total}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: progress.color }}
        />
      </div>

      {/* Step counter */}
      <span
        className="text-xs font-medium whitespace-nowrap tabular-nums"
        style={{ color: "var(--hc-cream-muted)" }}
      >
        {progress.current}/{progress.total}
      </span>
```

Note: `progress.color` (the fill bar itself) is left untouched — it's driven dynamically by `NavProgressContext`, not a static brand color, and is out of scope for this file-local restyle.

- [ ] **Step 6: Restyle the progress widget's button wrapper hover state**

Find (inside `ProgressWidget`, the outer `<button>`):

```tsx
        mobile ? "w-full px-0 py-1" : "flex-1 px-2 py-1 hover:bg-indigo-50",
```

Replace with:

```tsx
        mobile ? "w-full px-0 py-1" : "flex-1 px-2 py-1 hover:bg-[color-mix(in_oklch,var(--hc-terracotta)_10%,transparent)]",
```

- [ ] **Step 7: Restyle the messages icon button**

Find (in `MessagesIconButton`):

```tsx
      className="relative p-2 rounded-xl hover:bg-indigo-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
      aria-label={`Messages${unread > 0 ? ` (${unread} unread)` : ""}`}
    >
      <MessageCircle
        className="w-5 h-5"
        style={{ color: unread > 0 ? "oklch(0.42 0.22 270)" : "oklch(0.55 0.04 260)" }}
      />
```

Replace with:

```tsx
      className="relative p-2 rounded-xl hover:bg-[color-mix(in_oklch,var(--hc-terracotta)_12%,transparent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      aria-label={`Messages${unread > 0 ? ` (${unread} unread)` : ""}`}
    >
      <MessageCircle
        className="w-5 h-5"
        style={{ color: unread > 0 ? "var(--hc-terracotta)" : "var(--hc-cream-muted)" }}
      />
```

Leave the unread-count badge (`background: "oklch(0.55 0.22 25)"`, a few lines below) unchanged — it's a semantic alert color, not brand chrome.

- [ ] **Step 8: Restyle the notification bell trigger button (not its dropdown panel)**

Find:

```tsx
                onClick={() => { setBellOpen((o) => !o); if (!bellOpen) refetchNotifs(); }}
                className="relative p-2 rounded-xl hover:bg-indigo-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              >
                <Bell className="w-5 h-5" style={{ color: unreadCount > 0 ? "oklch(0.42 0.22 270)" : "oklch(0.55 0.04 260)" }} />
```

Replace with:

```tsx
                onClick={() => { setBellOpen((o) => !o); if (!bellOpen) refetchNotifs(); }}
                className="relative p-2 rounded-xl hover:bg-[color-mix(in_oklch,var(--hc-terracotta)_12%,transparent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              >
                <Bell className="w-5 h-5" style={{ color: unreadCount > 0 ? "var(--hc-terracotta)" : "var(--hc-cream-muted)" }} />
```

Leave the unread badge and everything from `{/* Bell dropdown panel */}` onward (the whole `bellOpen && (...)` block) **completely unchanged** — per the Global Constraints, this is a content surface that stays in its current light styling.

- [ ] **Step 9: Restyle the user dropdown trigger button**

Find:

```tsx
                <button
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  aria-label="User menu"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.42 0.22 270), oklch(0.65 0.18 340))" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span
                    className="hidden xl:block text-sm font-medium max-w-[120px] truncate"
                    style={{ color: "oklch(0.25 0.04 260)" }}
                  >
                    {user?.name ?? user?.email ?? "My account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                </button>
```

Replace with:

```tsx
                <button
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[color-mix(in_oklch,var(--hc-terracotta)_12%,transparent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  aria-label="User menu"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--hc-terracotta), var(--hc-ocre))" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span
                    className="hidden xl:block text-sm font-medium max-w-[120px] truncate"
                    style={{ color: "var(--hc-cream)" }}
                  >
                    {user?.name ?? user?.email ?? "My account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--hc-cream-muted)" }} aria-hidden="true" />
                </button>
```

- [ ] **Step 10: Restyle the user dropdown's `DropdownMenuContent` panel**

Find:

```tsx
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                <DropdownMenuLabel className="pb-1">
                  <p className="text-sm font-semibold truncate">{user?.name ?? "My account"}</p>
                  {user?.email && (
                    <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" />
                  My Dashboard
                </DropdownMenuItem>
```

Replace with:

```tsx
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl shadow-lg"
                style={{ backgroundColor: "var(--hc-espresso-deep)", borderColor: "color-mix(in oklch, var(--hc-cream) 12%, transparent)" }}
              >
                <DropdownMenuLabel className="pb-1">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--hc-cream)" }}>{user?.name ?? "My account"}</p>
                  {user?.email && (
                    <p className="text-xs font-normal truncate" style={{ color: "var(--hc-cream-muted)" }}>{user.email}</p>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator style={{ backgroundColor: "color-mix(in oklch, var(--hc-cream) 12%, transparent)" }} />

                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer rounded-lg focus:bg-[color-mix(in_oklch,var(--hc-terracotta)_16%,transparent)]"
                  style={{ color: "var(--hc-cream)" }}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" style={{ color: "var(--hc-terracotta)" }} aria-hidden="true" />
                  My Dashboard
                </DropdownMenuItem>
```

- [ ] **Step 11: Restyle the remaining dropdown items (Facilitator View, My Profile)**

Find:

```tsx
                {(user?.role === "admin" || user?.role === "superadmin" || user?.role === "facilitator") && (
                  <DropdownMenuItem
                    onClick={() => navigate("/facilitator")}
                    className="cursor-pointer rounded-lg text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                  >
                    <Shield className="w-4 h-4 mr-2 text-purple-500" aria-hidden="true" />
                    Facilitator View
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer rounded-lg"
                >
                  <User className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
                  My Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                  aria-label="Sign out of HeadCheck"
                >
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span>{logoutMutation.isPending ? "Signing out…" : "Sign Out"}</span>
                </DropdownMenuItem>
```

Replace with (the Facilitator View and Sign Out items keep their distinct purple/red semantic colors exactly as-is — only the background/base text they sit on changes):

```tsx
                {(user?.role === "admin" || user?.role === "superadmin" || user?.role === "facilitator") && (
                  <DropdownMenuItem
                    onClick={() => navigate("/facilitator")}
                    className="cursor-pointer rounded-lg text-purple-400 focus:text-purple-300 focus:bg-purple-950/40"
                  >
                    <Shield className="w-4 h-4 mr-2 text-purple-400" aria-hidden="true" />
                    Facilitator View
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer rounded-lg focus:bg-[color-mix(in_oklch,var(--hc-terracotta)_16%,transparent)]"
                  style={{ color: "var(--hc-cream)" }}
                >
                  <User className="w-4 h-4 mr-2" style={{ color: "var(--hc-cream-muted)" }} aria-hidden="true" />
                  My Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator style={{ backgroundColor: "color-mix(in oklch, var(--hc-cream) 12%, transparent)" }} />

                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer rounded-lg text-red-400 focus:text-red-300 focus:bg-red-950/40"
                  aria-label="Sign out of HeadCheck"
                >
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span>{logoutMutation.isPending ? "Signing out…" : "Sign Out"}</span>
                </DropdownMenuItem>
```

- [ ] **Step 12: Restyle the Sign In / Get Started buttons (logged-out desktop state)**

Find:

```tsx
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="rounded-lg font-semibold text-white focus-visible:ring-2 focus-visible:ring-indigo-600"
                style={{ background: "linear-gradient(135deg, oklch(0.42 0.22 270), oklch(0.65 0.18 340))" }}
                onClick={() => navigate("/register")}
              >
                Get Started Free
              </Button>
            </div>
```

Replace with:

```tsx
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-orange-400"
                style={{ color: "var(--hc-cream)" }}
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="rounded-lg font-semibold text-white focus-visible:ring-2 focus-visible:ring-orange-400"
                style={{ background: "linear-gradient(135deg, var(--hc-terracotta), var(--hc-ocre))" }}
                onClick={() => navigate("/register")}
              >
                Get Started Free
              </Button>
            </div>
```

- [ ] **Step 13: Restyle the mobile hamburger button**

Find:

```tsx
        <button
          className="lg:hidden p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: "oklch(0.42 0.22 270)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
```

Replace with:

```tsx
        <button
          className="lg:hidden p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: "var(--hc-cream)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
```

- [ ] **Step 14: Leave the step-summary panel untouched**

The block starting at `{/* ── Step Summary Panel (animated dropdown below NavBar) ── */}` through its closing `)}` (the `summaryVisible && progress.steps.length > 0 && (...)` block, including `StepIcon`) stays exactly as it is today — per the Global Constraints, this is a content surface. Do not edit it.

- [ ] **Step 15: Restyle the mobile menu drawer container and its links**

Find:

```tsx
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden bg-white border-t px-4 py-4 space-y-1"
          style={{ borderColor: "oklch(0.92 0.03 260)" }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => { navigate(link.href); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              style={{
                background: isActive(link.href) ? "oklch(0.94 0.04 270)" : "transparent",
                color: isActive(link.href) ? "oklch(0.42 0.22 270)" : "oklch(0.40 0.04 260)",
              }}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              <span aria-hidden="true">{link.emoji}</span><span>{link.label}</span>
            </button>
          ))}

          <div className="pt-2 border-t" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
```

Replace with:

```tsx
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t px-4 py-4 space-y-1"
          style={{
            backgroundColor: "var(--hc-espresso-deep)",
            borderColor: "color-mix(in oklch, var(--hc-cream) 12%, transparent)",
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => { navigate(link.href); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              style={{
                background: isActive(link.href)
                  ? "color-mix(in oklch, var(--hc-terracotta) 18%, transparent)"
                  : "transparent",
                color: isActive(link.href) ? "var(--hc-cream)" : "var(--hc-cream-muted)",
              }}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              <span aria-hidden="true">{link.emoji}</span><span>{link.label}</span>
            </button>
          ))}

          <div className="pt-2 border-t" style={{ borderColor: "color-mix(in oklch, var(--hc-cream) 12%, transparent)" }}>
```

- [ ] **Step 16: Restyle the mobile authenticated-user block**

Find:

```tsx
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-50">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.42 0.22 270), oklch(0.65 0.18 340))" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.25 0.04 260)" }}>
                      {user?.name ?? "My account"}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </div>
```

Replace with:

```tsx
              <div className="space-y-2">
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "color-mix(in oklch, var(--hc-terracotta) 14%, transparent)" }}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--hc-terracotta), var(--hc-ocre))" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--hc-cream)" }}>
                      {user?.name ?? "My account"}
                    </p>
                    {user?.email && (
                      <p className="text-xs truncate" style={{ color: "var(--hc-cream-muted)" }}>{user.email}</p>
                    )}
                  </div>
                </div>
```

- [ ] **Step 17: Restyle the mobile Dashboard/Sign Out buttons**

Find:

```tsx
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => { navigate(dashboardPath); setMobileOpen(false); }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Dashboard
                  </Button>
```

Replace with:

```tsx
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                    style={{ borderColor: "color-mix(in oklch, var(--hc-cream) 20%, transparent)", color: "var(--hc-cream)" }}
                    onClick={() => { navigate(dashboardPath); setMobileOpen(false); }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Dashboard
                  </Button>
```

Leave the mobile "Sign Out" button (`border-red-200 text-red-600 ...`) unchanged — same semantic-color rule as Step 11.

- [ ] **Step 18: Restyle the mobile logged-out Sign In / Get Started buttons**

Find:

```tsx
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => { navigate("/login"); setMobileOpen(false); }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="w-full rounded-xl font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, oklch(0.42 0.22 270), oklch(0.65 0.18 340))" }}
                  onClick={() => { navigate("/register"); setMobileOpen(false); }}
                >
                  Get Started Free
                </Button>
              </div>
```

Replace with:

```tsx
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl"
                  style={{ borderColor: "color-mix(in oklch, var(--hc-cream) 20%, transparent)", color: "var(--hc-cream)" }}
                  onClick={() => { navigate("/login"); setMobileOpen(false); }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="w-full rounded-xl font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, var(--hc-terracotta), var(--hc-ocre))" }}
                  onClick={() => { navigate("/register"); setMobileOpen(false); }}
                >
                  Get Started Free
                </Button>
              </div>
```

- [ ] **Step 19: Verify**

Run: `npm run check`
Expected: no new TypeScript errors.

- [ ] **Step 20: Commit**

```bash
git add client/src/components/NavBar.tsx
git commit -m "Restyle NavBar in the Sagesse Africaine direction"
```

---

### Task 3: Visual verification

**Files:** none modified — this task produces screenshots, not code.

**Interfaces:**
- Consumes: the running app from Tasks 1-2, at `NavBar`-rendering routes.

- [ ] **Step 1: Start the app locally**

A Docker MySQL container from earlier local preview work, named `headcheck-preview-db`, is available — check with `docker ps -a --filter "name=headcheck-preview-db"`. If it shows `Up`, it's ready to use as-is. If it exists but is stopped, start it with `docker start headcheck-preview-db`. If it doesn't exist at all, create it:

```bash
docker run -d --name headcheck-preview-db -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=headcheck \
  mysql:8.0
```

Confirm `.env` has `DATABASE_URL="mysql://root:rootpassword@127.0.0.1:3306/headcheck"` (already present as of this writing — check before assuming, `.env` is not committed to git). Then:

```bash
npm run dev
```

The dev server needs the other `requiredEnvVars` (`JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `OPENAI_API_KEY`) present in `.env` too — any non-empty placeholder string works for booting and viewing the navbar, since this task never exercises the routes that actually call those services.

- [ ] **Step 2: Capture screenshots**

Using Puppeteer (already a dev dependency in this repo, used earlier this session for the same purpose), capture:
- `/` (Home) — logged out, desktop width (1280px) and mobile width (390px), mobile menu open and closed.
- `/about` — logged out, desktop width.
- `/pricing` — logged out, desktop width.
- Any one page while authenticated (e.g. `/` after logging in, or a page reachable with a seeded test session) — desktop width, to confirm the user dropdown, messages icon, and notification bell (if applicable to the test account's role) render correctly against the dark bar.
- The user dropdown menu open (click the avatar), to confirm Step 10-11's dark popup styling.

- [ ] **Step 3: Compare against the approved mockups**

Check each screenshot against what was approved in the brainstorming session (`.superpowers/brainstorm/8534-1784123765/content/navbar-full.html`, if that directory still exists — otherwise against the written spec's description): espresso background, terracotta accents on active/hover states, Fraunces logo wordmark, cream text legible against the dark bar, notification bell and step-summary panel unchanged from their original light styling.

- [ ] **Step 4: Fix any visual issues found**

If a screenshot reveals a problem (e.g., insufficient contrast, a missed color reference, layout shift from the font change), fix it directly in `NavBar.tsx` and re-capture the affected screenshot. Do not proceed to Step 5 until all screenshots match the approved direction.

- [ ] **Step 5: Report**

No commit for this task (no code changes unless Step 4 found something, in which case commit that fix separately: `git commit -m "Fix visual issues found in navbar verification pass"`). Summarize what was checked and confirmed.
