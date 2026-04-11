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

## Phase 12: headcheck.app Full Content Integration

### Design & Branding
- [x] Update color palette: purple/violet primary + orange/amber gradient accent
- [x] Update nav: add Compass + Zera Cards nav items, use icon+text labels
- [x] Update hero gradient bar (horizontal purple→orange→green accent)
- [x] Update CTA buttons to pill-shaped gradient (purple→orange)

### Homepage Copy
- [x] Update hero tagline: "Your supportive space for clarity"
- [x] Update hero subline: "Transform stress into clarity with guided check-ins that feel rewarding and empowering"
- [x] Add "What is HeadCheck?" section with exact copy
- [x] Add "How it works" 4-step list
- [x] Add "Who is this for?" section
- [x] Add 3 feature cards: Ground Yourself | Name Your Feelings | Find Direction
- [x] Add Self Trust Compass preview section on homepage

### Compass / Seven Mirrors Rename & Update
- [x] Rename "Seven Mirrors" → "Self Trust Compass" throughout the app
- [x] Update Compass intro page with "A Journey Inward" badge
- [x] Update subtitle and "What to Expect" section with exact copy from headcheck.app
- [x] Update 7 mirror theme names to: Self-Awareness | Self-Compassion | Boundaries | Authenticity | Decision-Making | Resilience | Growth Mindset

### Resources Library
- [x] Replace existing resources with full 22-item list from headcheck.app
- [x] Add African proverbs inline on resource cards
- [x] Add read/watch time badges on each card

### Zera Cards Page (NEW)
- [x] Create /zera-cards page with ZERA hero, 5 pillars, About ZERA section
- [x] Add interactive card flip demo (proverb → EI pillar + explanation)
- [x] Add link to zeracards.com

### Disclaimer
- [x] Add disclaimer footer on Check-In and Compass pages

## Phase 13: Guest / Free Access (No Login Required)

- [x] Backend: convert checkIn.create to publicProcedure (save only if user is authenticated)
- [x] Backend: convert sevenMirrors.startSession and submitMirrorResponse to publicProcedure (in-memory session for guests)
- [x] Backend: convert dashboard.getCheckIns to publicProcedure (return empty for guests)
- [x] Frontend: remove hard auth redirect from CheckIn.tsx — allow guests to complete full flow
- [x] Frontend: remove hard auth redirect from SevenMirrors.tsx — allow guests to complete full Compass flow
- [x] Frontend: show soft "Save your progress" login nudge after Check-In result and Compass completion
- [x] Frontend: ensure Resources, Mindset, Zera Cards, LearnEI pages are fully public (no auth check)
- [x] Frontend: update Home.tsx hero CTA — no login required to start
- [x] Frontend: update nav — show Login button only when not authenticated (no forced redirect)

## Phase 14: heartcheck.app Full Integration

### Check-In Flow Enhancements
- [x] Add multi-select stressor/context step (School pressure, Work burnout, Family tension, Financial stress, Decision fatigue, Conflict, Uncertainty, Communication)
- [x] Add "What do you need most right now?" step (Moment of reflection, Breathing pause, Reminder about voice)
- [x] Add Grounding Practice step (4-4-6 Breath, Body Scan, Self-Compassion) as final step before result
- [x] Add personalized guidance messages based on emotion + context combination
- [x] Add completion affirmations ("You don't have to carry everything alone...")

### Dashboard Enhancements
- [ ] Add Emotion Distribution pie/donut chart
- [ ] Add Daily Check-in Activity heatmap/bar chart
- [ ] Add CSV export of check-in history (privacy-first, browser-side generation)
- [ ] Add Wellness Logbook page (journal entries from check-ins)
- [ ] Add Personalized Recommendations section (after 3+ check-ins)

### Coaching Module (New)
- [x] Add Coaching page with 3 session types: 30-min, 60-min, 3-session journey
- [x] Add Organization Coaching inquiry form
- [x] Add My Coaching Sessions page (view booked sessions, join call)
- [x] Backend: coaching sessions table, booking procedure

### Business/Enterprise Enhancements
- [ ] Add Pulse Surveys feature (create surveys, gather team feedback)
- [ ] Add Team Sentiment Analysis (from check-in comments)
- [ ] Add CSV export for business reports
- [ ] Add "Add Resources for Employees" feature in Facilitator Dashboard
- [ ] Add company registration form with industry selector (Finance, Professional Services, etc.)

### Resources Library Enhancements
- [ ] Add 8 new curated resources: Feeling Wheel, Empathy Mapping, Nonviolent Communication, Difficult Conversations, Drive (Daniel Pink), Mindful Self-Compassion (Neff), Self-Awareness (Eurich), Hidden Brain Podcast
- [ ] Add interactive Feeling Wheel tool (expand emotional vocabulary)
- [ ] Add resource type filter: Article, Video, Book, Exercise, Tool, Podcast

### Learn EI Enhancements
- [ ] Add "Benefits of EI" section with 8 research-backed benefits
- [ ] Add "How It Works" 4-step section: Check In → Grounding → Guidance → Grow
- [ ] Add interactive EI self-assessment quiz (score per pillar)

### About Page (New)
- [x] Create About page with platform description, mission, how it works, and team section

### Design & UX
- [ ] Add floating card glow effects on hover (amber/orange gradient)
- [ ] Add animate-scale-in / animate-fade-in-up CSS animations
- [ ] Update Home hero copy to match heartcheck.app warmth and tone
