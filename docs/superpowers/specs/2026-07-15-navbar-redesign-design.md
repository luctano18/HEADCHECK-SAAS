# Navigation Chrome Redesign — Phase 1: Marketing Navbar

**Date:** 2026-07-15
**Status:** Approved

## Context

The user asked for a better design for the navbar and, longer-term, the wider
SaaS. The current `NavBar.tsx` uses a generic indigo/coral gradient look
(shared with most of the app's buttons and emails) and hardcoded `oklch()`
values inline rather than design tokens. The product's own copy already
carries a distinct voice — "Powered by African wisdom and AI" — that has
never been expressed visually anywhere in the product.

Explored visually with the user via mockups (three brand directions, three
typography pairings, a full navbar at real width, and a sidebar concept) and
landed on: a warm, grounded "Sagesse Africaine" direction (deep
espresso/terracotta/ocre, Fraunces + Public Sans typography, a simple
geometric SVG logomark) for the navigation chrome, plus a longer-term
decision to move the *authenticated app* off the horizontal navbar entirely
and onto a sidebar (reusing the already-present-but-unused
`components/ui/sidebar.tsx` shadcn primitives).

## Scope

This spec covers **Phase 1 only**: the design tokens and the marketing-facing
`NavBar.tsx`, applied to the public pages that keep a horizontal top nav.
Phase 2 (building the app sidebar and migrating authenticated pages off
`NavBar`) is a separate, larger chantier — described at the end of this
document under "Phase 2 (future work, not in this spec)" so the direction
isn't lost, but it gets its own brainstorming pass before implementation.

In scope for Phase 1:
- New design tokens for navigation chrome in `client/src/index.css`.
- An inline SVG logomark replacing the external CloudFront PNG.
- `NavBar.tsx` restyled with the new tokens, fonts, and logomark — same
  structure, same 10 links, same interactive behavior (dropdown menu, mobile
  hamburger, messages icon, notification bell, progress widget). No layout
  or information-architecture changes in this phase.
- Font loading for Fraunces + Public Sans, added to the existing Google
  Fonts link in `client/index.html` (alongside the current Inter/Playfair
  Display, not replacing them — those remain the body/page fonts elsewhere
  in the app for this phase).

Out of scope for Phase 1:
- Any change to page content, buttons, or cards outside the navbar
  (they keep the current indigo/coral palette).
- Any change to the 10-item link list itself, grouping, or dropdown
  behavior — purely a visual re-skin of the existing structure.
- Dark mode variants — the app has no user-facing theme toggle
  (`ThemeProvider defaultTheme="light"`, not switchable), so the navbar's
  dark espresso background is simply how this component looks, independent
  of the app's (currently inactive) light/dark system.

## Design

### 1. New design tokens (`client/src/index.css`)

Added to `:root`, alongside the existing `--hc-*` tokens (not replacing
them — `--primary`, `--accent`, etc. keep their current indigo/coral
values, used everywhere except the navbar):

```css
/* Navigation chrome — "Sagesse Africaine" direction (navbar/sidebar only) */
--hc-espresso:    oklch(0.22 0.03 55);   /* nav background */
--hc-espresso-deep: oklch(0.16 0.03 55); /* mobile menu / dropdown panels */
--hc-terracotta:  oklch(0.60 0.14 45);   /* primary nav accent */
--hc-ocre:        oklch(0.50 0.13 35);   /* secondary nav accent */
--hc-cream:       oklch(0.95 0.02 75);   /* text on dark nav background */
--hc-cream-muted: oklch(0.75 0.05 65);   /* secondary text on dark nav background */
```

### 2. Fonts (`client/index.html`)

Extend the existing Google Fonts `<link>` (do not add a second link tag —
one request, matching the current pattern):

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Fraunces:wght@600;700&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

`Fraunces` (weights 600/700) is the navbar's display face (logo wordmark,
nothing else needs it in this phase). `Public Sans` (400/500/600) is the
navbar's link/label face, replacing the inherited body font *only inside
`<nav>`* via a scoped class — the rest of the page keeps its current font.

### 3. Logomark (inline SVG, replaces the CloudFront PNG)

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

Placed directly in `NavBar.tsx` (not a separate file — it's an 8-line
component used in exactly one place). Removes the dependency on the
external CloudFront asset for the navbar (the same image is still used
elsewhere, e.g. Open Graph meta tags in `client/index.html` — those are
untouched by this spec).

### 4. `NavBar.tsx` restyle

Same JSX structure as today (logo button, desktop link row, progress
widget, messages/bell icons, user dropdown, mobile hamburger + drawer) —
every `oklch(0.42 0.22 270)` / `oklch(0.65 0.18 340)` / `bg-white` /
`bg-indigo-50` style value in the file is replaced with the new tokens:

| Current | New |
|---|---|
| `bg-white/90` (nav background) | `var(--hc-espresso)` |
| `oklch(0.42 0.22 270)` (active link, logo text) | `var(--hc-cream)` |
| `oklch(0.94 0.04 270)` (active link background) | `var(--hc-terracotta)` at low opacity, e.g. `color-mix(in oklch, var(--hc-terracotta) 18%, transparent)` |
| `oklch(0.40 0.04 260)` (inactive link text) | `var(--hc-cream-muted)` |
| `hover:bg-indigo-50` (icon button hover) | `color-mix(in oklch, var(--hc-terracotta) 12%, transparent)` |
| `linear-gradient(135deg, oklch(0.42 0.22 270), oklch(0.65 0.18 340))` (CTA button, avatar) | `linear-gradient(135deg, var(--hc-terracotta), var(--hc-ocre))` |
| Mobile menu / dropdown panel background (`bg-white`) | `var(--hc-espresso-deep)` |
| Logo `<img>` element | `<LogoMark />` |

Text color inside light-background panels that stay light (e.g. the
notification bell dropdown, which shows notification content and should
stay legible/neutral, not espresso-on-espresso) keeps its current
white/gray styling — only the top nav bar itself, the mobile drawer, and
the logo/CTA button move to the new palette. This is a judgment call to
flag explicitly: the notification bell's dropdown panel is a content
surface, not chrome, so it's excluded from the token swap.

The `<nav>` root element gets `font-family: 'Public Sans', sans-serif`
applied via a Tailwind arbitrary-value class or inline style, and the logo
wordmark span gets `font-family: 'Fraunces', serif`.

### Error Handling

None applicable — this is a static visual change with no new data flow,
network calls, or state. The removed external image dependency
(CloudFront PNG) is a minor reliability improvement: the SVG logomark
can't fail to load.

### Testing

No unit-testable logic (pure presentational component, matching the
existing convention that this repo has no frontend test infrastructure —
`vitest.config.ts` only includes `server/**/*.test.ts`). Verification is
visual: a Puppeteer screenshot pass (same approach as the earlier full-SaaS
preview this session) across the pages that render `NavBar` — logged-out
and logged-in states, desktop and mobile widths — checked against the
approved mockups before considering the phase complete.

## Phase 2 (future work, not in this spec)

Direction only, to be brainstormed in full before implementation:

- New `AppSidebar.tsx` built on the existing `components/ui/sidebar.tsx`
  shadcn primitives (`Sidebar`, `SidebarProvider`, `SidebarMenu`,
  `useSidebar`, etc.) — already present in the codebase but currently
  unused by any route (`DashboardLayout.tsx`, which references them, is
  dead code with zero page imports as of this writing).
- Styled via the existing `--sidebar`, `--sidebar-foreground`,
  `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border` tokens
  already defined in `client/src/index.css` (currently unused for the same
  reason) — redefined to the espresso/terracotta palette rather than
  inventing a new token family, since the shadcn primitives already read
  exactly those names.
- Two states: expanded (240px, grouped sections — "Today", "Resources",
  "Account") and collapsed (72px, icons only).
- Migration of the ~15 authenticated routes currently rendering `NavBar`
  (Dashboard, CheckIn, Compass/SevenMirrors, Resources, Mindset, Messages,
  WellnessLogbook, Profile, Notifications, FacilitatorDashboard, etc.) to a
  new layout wrapper using `AppSidebar` instead.
- The ~8 public/marketing routes (Home, About, Pricing, ForInstitutions,
  Coaching, EIQuiz, Login, Register, and the auth flow pages) keep
  `NavBar` from this Phase 1 spec unchanged.
