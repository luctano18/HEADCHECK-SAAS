# HeadCheck AI SaaS — TODO

## Phase 1: Database Schema & Backend Foundation
- [x] Design and migrate DB schema: users, institutions, groups, check_ins, ai_responses, seven_mirrors_sessions, crisis_events, invitations
- [x] Seed AIEI proverbs and EI pillars data
- [x] tRPC router: auth (me, logout, role)
- [x] tRPC router: institutions (create, getMyInstitution, inviteStudent)
- [x] tRPC router: checkIns (create, list, getById)
- [x] tRPC router: aiResponse (generate with crisis detection)
- [x] tRPC router: sevenMirrors (createSession, submitMirror, completeSession)
- [x] tRPC router: facilitator (dashboard, cohortTrends, highRiskAlerts)
- [x] Crisis detection logic (real-time keyword + intensity analysis)
- [x] AI response engine (6-part structured response via LLM)
- [x] Seven Mirrors AI summary generator

## Phase 2: Global Design System & Layout
- [x] Define design tokens: color palette (lavender/blush/sage), typography (Inter + Playfair Display), spacing, shadows
- [x] Update index.css with global CSS variables and dark/light theme
- [x] Create DashboardLayout with sidebar for authenticated users
- [x] Create PublicLayout with top nav for landing page
- [x] Register all routes in App.tsx

## Phase 3: Landing Page & Authentication
- [x] Build elegant landing page (Home.tsx) with hero, features, CTA
- [x] Login/Signup flow with role selection (individual vs. institution)
- [x] Onboarding wizard for new users (role setup)

## Phase 4: Emotional Check-In Flow
- [x] Step 1: Emotion selector (visual emotion cards with icons)
- [x] Step 2: Intensity slider (1-10)
- [x] Step 3: Context selector (School, Family, Relationships, Work, Self)
- [x] Step 4: Personal journal text area (optional)
- [x] Real-time crisis detection during journal input
- [x] Crisis intervention modal (988 hotline, immediate support)
- [x] AI response display (6-part structured card layout)

## Phase 5: Seven Mirrors Module
- [x] Seven Mirrors landing/intro page
- [x] Sequential mirror prompts (Values, Loyalty, Inner Conflict, Self-Appreciation, Red Flags, Growth, Peace)
- [x] Progress indicator across 7 mirrors
- [x] AI summary generation on completion
- [x] Badge award system (7 theme badges)
- [x] Session history list

## Phase 6: User Profile & History Dashboard
- [x] Emotional trend chart (line/area chart over time)
- [x] Check-in history list with AI response previews
- [x] Pattern recognition insights panel
- [x] Badge collection display

## Phase 7: Facilitator/Admin Dashboard
- [x] Aggregated emotional trend charts (anonymized cohort data)
- [x] High-risk alert notifications panel
- [x] Engagement metrics by cohort/group
- [x] Student group management

## Phase 8: Institutional Onboarding
- [x] Institution creation form (school admin)
- [x] Create student groups
- [x] Invite students by email (generate invitation links)
- [x] Accept invitation flow (student joins group)
- [x] Data isolation between institutions

## Phase 9: Polish & Tests
- [x] Vitest unit tests for AI engine, crisis detection, and routers
- [x] Responsive design verification (mobile/tablet/desktop)
- [x] Accessibility audit (focus rings, keyboard navigation)
- [x] Final checkpoint and delivery

## Phase 10: Inspired Updates (heartcheck.app + headcheck.app)
- [x] Redesign CSS: warm gradient palette (orange/rose/lavender), updated design tokens
- [x] Update landing page: warm hero gradient, multi-select emotion preview, streak/achievement showcase
- [x] Add "For Institutions" dedicated section on landing page with B2B benefits list
- [x] Update Check-In: multi-select emotions (allow selecting multiple feelings)
- [x] Build Resources Library page (filterable by EI category + type: articles/videos/books/exercises/tools)
- [x] Build Learn EI page (5 Pillars of EI with African proverbs per pillar)
- [x] Build Mindset page (daily affirmations + inspirational African proverbs)
- [x] Add streak system to backend (daily check-in streak counter)
- [x] Add achievements/badges system to user profile
- [x] Update Dashboard: streak counter widget, achievements display
- [x] Add "Book a Session" CTA button (links to external coaching)

## Phase 11: Gap Fixes & Remaining Items
- [x] For Institutions page created as standalone route (/for-institutions)
- [x] Streak system backend (updateUserStreak, getUserStreak, getUserAchievements)
- [x] Dashboard achievements panel and streak stat card
- [x] All new routes registered in App.tsx (Resources, LearnEI, Mindset, ForInstitutions)
- [x] TypeScript: 0 errors | Tests: 10/10 passing
