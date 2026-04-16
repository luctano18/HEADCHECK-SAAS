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

## Phase 15: Consolidation & Enrichment from Source Files

### A. Route & Navigation Consolidation (Eliminate Duplicates)
- [ ] Remove duplicate routes: keep /checkin (drop /check-in), keep /compass (drop /seven-mirrors), keep /checkin/result/:id (drop /check-in/:id), keep /checkin/guest-result (drop /check-in/guest)
- [ ] Remove ComponentShowcase.tsx page (dev-only, 1437 lines, not linked in nav)
- [ ] Merge ForInstitutions content into a dedicated tab/section within FacilitatorDashboard or keep as standalone but remove duplicate institution copy from Home.tsx
- [ ] Create a shared NavBar component used by ALL pages (currently each page has its own nav)
- [ ] Create a shared Footer component with links to all pages

### B. Content Deduplication
- [ ] Extract African proverbs into a shared data file (shared/proverbs.ts) — currently duplicated across LearnEI, ZeraCards, Mindset, About
- [ ] Extract EI pillars data into shared/eiPillars.ts — currently duplicated across LearnEI, ZeraCards, About
- [ ] Extract Brain-Emotion mapping table into shared/brainEmotionMap.ts (from HeadCheck_Brain_Emotion_Mapping doc)

### C. Seven Mirrors / Compass — Full Rebuild from Source Docs
- [ ] Replace current generic Compass prompts with EXACT questions from 7 mirrors.docx:
  - Mirror 1: "What do I value most in my relationship with myself?" (9 options)
  - Mirror 2: "What does loyalty to me look like?" (8 options)
  - Mirror 3: "How do I handle conflict within myself?" (8 options)
  - Mirror 4: "What makes me feel appreciated by myself?" (8 options)
  - Mirror 5: "What red flags do I ignore within myself?" (8 options)
  - Mirror 6: "What am I currently working on within myself?" (8 options)
  - Mirror 7: "What does peace with me look like?" (8 options)
- [ ] Add "Other" option with revealed text input on every mirror
- [ ] Add optional "Write freely here" journal box on every mirror
- [ ] Update completion screen with exact copy from source doc
- [ ] Update AI summary to detect themes: Self Trust, Boundaries, Burnout, Self-Compassion, Growth, Peace, Emotional Safety
- [ ] Update theme badges: Self Trust, Growth, Healing, Boundaries, Inner Peace, Emotional Safety

### D. Check-In Flow — Full Rebuild from Master Mocha Prompt (10 steps)
- [ ] Step 1: Single select — "What feels strongest for you right now?" (11 emotions including Frustrated, Hopeful but uncertain)
- [ ] Step 2: Multi-select — "What might be contributing to how you feel?" (13 stressors)
- [ ] Step 3: Multi-select — "How is this affecting you emotionally?" (10 emotional impacts)
- [ ] Step 4: Multi-select — "Which feelings feel most intense?" (10 intense feelings)
- [ ] Step 5: Multi-select — "Which of these might also be affecting you?" (10 life factors)
- [ ] Step 6: Single select — "What feels most supportive for you right now?" (7 support needs)
- [ ] Step 7: Single select — "What feels possible for you right now?" (8 actions)
- [ ] Step 8: Single select — "Who or what kind of support could help?" (9 support types)
- [ ] Step 9: Single select — "Did this check-in help?" (3 options with conditional message)
- [ ] Step 10: Single select — "Would you like to save this check-in?" (Yes/No + Why This Works card)
- [ ] Add "Continue" button disabled until selection is made
- [ ] Add guidance card on Step 6 and reflection card on Step 8

### E. AI Response Engine — Exact 7-Part Structure from Source Docs
- [ ] Update AI response to follow exact 7-part structure: Emotional Reflection → Brain Insight → EI Focus → African Wisdom (proverb + country + explanation) → Pattern Insight → One Next Step → Support Encouragement
- [ ] Use exact Brain-Emotion mapping table from HeadCheck_Brain_Emotion_Mapping doc in AI prompt
- [ ] Add "This is your brain trying to protect you, not a failure." to Brain Insight card
- [ ] Add Pattern Insight card: detect repeated emotions from history and surface gently
- [ ] Add user feedback loop: Yes / Somewhat / Not yet buttons on AI response

### F. Check-In Summary Screen (Phase 4 from Master Mocha Prompt)
- [ ] Add dedicated summary screen BEFORE AI insight: What you may be feeling, What may be affecting you, What seems most supportive, Your next step, Support reminder
- [ ] Add gentle reminder card: "You may not need to solve everything today..."

### G. Brand & Tagline Alignment
- [ ] Update app tagline to: "A Real Time Emotional Response System — Know your mind. Lead your life."
- [ ] Update Home hero subtitle to match: "HeadCheck helps you understand your feelings, reflect with honesty, and take your next step with clarity."
- [ ] Add "Support Options" link in nav (links to crisis resources / coaching)

### H. Missing Features from Critical Layers Doc
- [ ] Add "Ask for Help" feature — mentor/counselor request button in dashboard
- [ ] Add AIEI Content Library page: proverbs searchable by country and EI pillar
- [ ] Add weekly reflection summary (email/notification to user after 7 days of check-ins)

## Phase 16: Interactive EI Quiz

- [x] Design 25-question EI quiz bank covering all 5 pillars (5 questions per pillar)
- [x] Add quizAttempts table to DB schema with pillar scores and total score
- [x] Add tRPC procedures: quiz.getQuestions, quiz.submitAttempt, quiz.getHistory, quiz.guestSubmit
- [x] Build interactive EI Quiz page with animated question flow, progress bar, timer
- [x] Build EI Quiz Results page with radar chart (Recharts), pillar breakdown cards, AI feedback
- [x] Add quiz history section to Dashboard
- [x] Add "Take the EI Quiz" CTA to LearnEI page
- [x] Add Quiz link to NavBar
- [x] Allow guest users to take the quiz without login (same pattern as Check-In)
- [x] Write Vitest tests for quiz scoring logic

## Phase 16 Gap Fixes

- [x] Add elapsed timer display to EIQuiz.tsx (shows time taken during quiz)
- [x] Add quiz history section to Dashboard (fetch trpc.quiz.getHistory, render recent attempts)

## Phase 17: Authentication & Authorization (OAuth2 + JWT + Email/Password)

### Backend
- [x] Add `user_credentials` table (userId, passwordHash, emailVerified, emailVerificationToken, emailVerificationExpiry)
- [x] Add `password_reset_tokens` table (id, userId, token, expiresAt, usedAt)
- [x] Generate and apply DB migration SQL
- [x] Install bcryptjs for password hashing
- [x] Add DB helpers: createCredential, getCredentialByUserId, updatePasswordHash, createPasswordResetToken, getPasswordResetToken, markTokenUsed
- [x] Add tRPC auth.register procedure (email + password, create user + credential, issue JWT session)
- [x] Add tRPC auth.loginEmail procedure (verify email + password, issue JWT session)
- [x] Add tRPC auth.forgotPassword procedure (generate reset token, send email via LLM/notification)
- [x] Add tRPC auth.resetPassword procedure (validate token, update password hash)
- [x] Add tRPC auth.changePassword procedure (protected, verify old password, update hash)
- [x] Add tRPC auth.verifyEmail procedure (validate verification token, mark email verified)
- [x] Add email sending helper using Manus notification or SMTP

### Frontend
- [x] Create /register page (email + password + name, form validation, show errors)
- [x] Create /login page (email/password + OAuth2 button, form validation)
- [x] Create /forgot-password page (email input, success message)
- [x] Create /reset-password page (new password + confirm, token from URL)
- [x] Update NavBar: show Login/Register buttons for guests
- [x] Update useAuth: expose loginWithEmail, register methods (via tRPC mutations directly)
- [x] Add "Sign in with HeadCheck" (OAuth2) + "Sign in with Email" tabs on login page
- [x] Show email verification banner for unverified accounts
- [x] Add password strength indicator on register page

### Security
- [x] Rate limit auth endpoints (10 attempts / 15 min per IP, in-memory)
- [x] Sanitize and validate all auth inputs with Zod
- [x] Hash passwords with bcrypt (cost factor 12)
- [x] JWT tokens expire in 1 year (session cookie, httpOnly)
- [x] Password reset tokens expire in 1 hour, single-use

## Phase 18: Social Login (Google OAuth2 + GitHub OAuth2)

### Backend
- [x] Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET secrets
- [x] Create server/_core/socialAuth.ts with Google and GitHub OAuth2 flows
- [x] Add GET /api/auth/google → redirect to Google authorization URL
- [x] Add GET /api/auth/google/callback → exchange code, fetch profile, upsert user, issue JWT session
- [x] Add GET /api/auth/github → redirect to GitHub authorization URL
- [x] Add GET /api/auth/github/callback → exchange code, fetch profile, upsert user, issue JWT session
- [x] Register social auth routes in server/_core/index.ts
- [x] Social auth URLs are direct /api/auth/{provider} routes (no tRPC needed)

### Frontend
- [x] Add Google sign-in button to /login page (with Google logo)
- [x] Add GitHub sign-in button to /login page (with GitHub logo)
- [x] Add Google sign-in button to /register page
- [x] Add GitHub sign-in button to /register page
- [x] Handle OAuth callback success/error redirect (redirect to /dashboard or /login?error=...)
- [x] Show loading state during social auth redirect (spinner on button click)

### Security & UX
- [x] Use state parameter (CSRF protection) stored in httpOnly cookie, verified on callback
- [x] Link social accounts to existing email accounts (same email → reuse existing openId)
- [x] Store loginMethod as 'google' or 'github' in users table via upsertUser
- [x] Write Vitest tests for state generation, URL construction, profile mapping (22 tests)

## Phase 18b: Retrait de GitHub OAuth2

- [x] Supprimer les routes GitHub (/api/auth/github et /api/auth/github/callback) de socialAuth.ts
- [x] Supprimer le bouton GitHub de SocialAuthButtons.tsx
- [x] Supprimer les tests GitHub de socialAuth.test.ts
- [x] Mettre à jour todo.md Phase 18 pour refléter le retrait de GitHub

## Phase 19: Bouton de déconnexion dans l'en-tête

- [x] Lire NavBar.tsx et useAuth pour comprendre l'état actuel
- [x] Remplacer le bouton "Sign Out" basique par un menu dropdown utilisateur (avatar initiales, nom, email, lien Dashboard, bouton Sign Out rouge)
- [x] Ajouter confirmation visuelle de déconnexion (toast avec message de confirmation)
- [x] Vérifier accessibilité : focus visible, aria-label, keyboard navigation, aria-current
- [x] 0 erreur TypeScript

## Phase 20: Graphiques de suivi de l'humeur (30j / 90j)

- [x] Analyser le schéma DB (checkIns, emotionScores) et les helpers existants
- [x] Ajouter tRPC procedure `dashboard.getMoodTrend(days: 30|90)` avec agrégation quotidienne
- [x] Ajouter tRPC procedure `dashboard.getMoodStats(days)` (moyenne, min, max, tendance)
- [x] Créer composant `MoodTrendChart.tsx` avec AreaChart Recharts, onglets 30j/90j
- [x] Afficher les statistiques clés : score moyen, meilleur jour, pire jour, tendance (+/-)
- [x] Afficher un état vide engageant si moins de 3 check-ins
- [x] Intégrer le composant dans le Dashboard après la section streak
- [x] Écrire tests Vitest pour l'agrégation quotidienne et le calcul de tendance (16/16)
- [x] 0 erreur TypeScript

## Phase 21: Filtrage par émotion sur les graphiques d'humeur

- [x] Étendre `getMoodTrendByUser(userId, days, emotion?)` pour filtrer par émotion
- [x] Étendre `getMoodStatsByUser(userId, days, emotion?)` pour filtrer par émotion
- [x] Ajouter `getAvailableEmotions(userId, days)` helper pour lister les émotions présentes
- [x] Mettre à jour les procédures tRPC `dashboard.getMoodTrend` et `dashboard.getMoodStats` avec input `emotion` optionnel
- [x] Ajouter procédure tRPC `dashboard.getAvailableEmotions` pour alimenter le sélecteur
- [x] Ajouter chips de sélection d'émotion dans `MoodTrendChart.tsx` (colorisées, "Toutes" par défaut)
- [x] Mettre à jour les requêtes tRPC dans `MoodTrendChart.tsx` pour passer le filtre émotion
- [x] Afficher le nom de l'émotion filtrée dans le titre du graphique
- [x] Écrire tests Vitest pour le filtrage par émotion (29/29)
- [x] 0 erreur TypeScript

## Phase 22: NavBar persistante sur /checkin et /compass

- [x] Analyser App.tsx pour voir comment la NavBar est montée
- [x] Ajouter NavBar sur /checkin (page CheckIn) — intro screen (step 0) + step screen
- [x] Ajouter NavBar sur /compass (page Compass / Seven Mirrors) — intro, mirror, complete phases
- [x] Supprimer les 3 headers maison de SevenMirrors.tsx et remplacer par NavBar
- [x] Ajuster pt-24/pt-28 pour compenser la hauteur de la NavBar fixe
- [x] 0 erreur TypeScript

## Phase 23: Indicateur de progression dans la NavBar

- [x] Créer un contexte React `NavProgressContext` (current, total, label, color)
- [x] Ajouter une barre de progression fine sous la NavBar (conditionnelle, visible uniquement sur /checkin et /compass)
- [x] Afficher étape courante / total + libellé du parcours dans la NavBar (ex. "Check-In · 3 / 10")
- [x] Brancher le contexte dans CheckIn.tsx (currentStep / totalSteps)
- [x] Brancher le contexte dans SevenMirrors.tsx (currentMirror / SEVEN_MIRRORS.length)
- [x] Réinitialiser le contexte au démontage des pages (useEffect cleanup)
- [x] 0 erreur TypeScript

## Phase 24: Panneau de résumé des étapes cliquable

- [x] Étendre NavProgressContext avec `steps: StepSummary[]` (id, label, icon, status: done|current|upcoming)
- [x] Créer le composant `ProgressSummaryPanel` intégré directement dans NavBar
- [x] Rendre l'indicateur de progression cliquable pour ouvrir/fermer le panneau
- [x] Afficher chaque étape avec statut visuel (✓ complétée, ● en cours, ○ à venir)
- [x] Brancher les données d'étapes CheckIn dans CheckIn.tsx (CHECKIN_STEPS → steps)
- [x] Brancher les données d'étapes Compass dans SevenMirrors.tsx (SEVEN_MIRRORS → steps)
- [x] Fermer le panneau au clic extérieur ou sur Échap
- [x] 0 erreur TypeScript

## Phase 25: Animation fluide du panneau de résumé

- [x] Ajouter animation d'entrée/sortie (opacity + translateY + max-height) sur le panneau de résumé
- [x] Utiliser CSS transitions natives (pas de librairie externe) pour la fluidité
- [x] Animer aussi les items de la liste (stagger delay via CSS transition-delay)
- [x] 0 erreur TypeScript

## Phase 26: Icône de chargement dans le panneau de résumé

- [x] Ajouter `isLoadingSteps` dans NavProgressContext
- [x] Afficher un spinner centré dans le panneau quand `isLoadingSteps === true`
- [x] Brancher `isLoadingSteps` dans CheckIn.tsx (true pendant le chargement initial des données)
- [x] Brancher `isLoadingSteps` dans SevenMirrors.tsx (true pendant le chargement initial)
- [x] 0 erreur TypeScript

## Phase 27: Correction erreur removeChild

- [x] Identifier les composants avec rendu conditionnel instable (texte brut, nœuds sans clé)
- [x] Ajouter ErrorBoundary global dans App.tsx pour capturer les erreurs React silencieuses
- [x] Protéger les textes dynamiques contre la modification DOM par extensions navigateur (span wrapper)
- [x] Vérifier les clés de liste dans NavBar, MoodTrendChart, EIQuiz, Dashboard
- [x] 0 erreur TypeScript

## Phase 28: Module Prévention de la Violence & Alerte de Crise

### Backend
- [ ] Étendre `detectCrisis()` avec mots-clés de violence envers autrui (menace, agression, arme)
- [ ] Ajouter table `violence_flags` (userId, checkInId, triggerText, type, severity, acknowledged)
- [ ] Ajouter table `safety_plans` (userId, trustedContacts JSON, warningSignals, copingStrategies, safeEnvironments)
- [ ] Ajouter helpers DB: createViolenceFlag, getViolenceFlagsByUser, createSafetyPlan, getSafetyPlan, updateSafetyPlan
- [ ] Ajouter procédures tRPC: crisis.reportFlag, crisis.getMyFlags, crisis.getSafetyPlan, crisis.saveSafetyPlan
- [ ] Générer et appliquer la migration SQL

### Frontend — Page CrisisSupport (/crisis-support)
- [ ] Créer page /crisis-support avec écran d'alerte plein écran (titre "Vous n'êtes pas seul·e")
- [ ] Boutons d'urgence: Appeler 988, SMS 741741, SOS Amitié 09 72 39 40 50, urgences locales
- [ ] Carte "Rester avec moi" (reconnexion douce après crise)
- [ ] Section ressources de crise (liens vérifiés, OMS, UNICEF)
- [ ] Disclaimer: HeadCheck n'est pas un service de crise

### Frontend — Page ViolencePrevention (/violence-prevention)
- [ ] Créer page /violence-prevention avec contenu éducatif (signes d'alerte, cycle de la violence, AIEI)
- [ ] Module "Mon Plan de Sécurité" (contacts de confiance, signaux d'alerte personnels, stratégies d'adaptation)
- [ ] Ressources AIEI (proverbes africains sur la paix et la résolution de conflits)
- [ ] Formulaire de plan de sécurité sauvegardé en DB pour utilisateurs connectés

### Intégration
- [ ] Détecter violence dans CheckIn.tsx et rediriger vers /crisis-support
- [ ] Ajouter liens "Support de Crise" et "Prévention Violence" dans NavBar
- [ ] Ajouter onglet "Alertes" dans FacilitatorDashboard (violence_flags + crisis_events)
- [ ] Ajouter section "Plan de Sécurité" dans Dashboard utilisateur
- [ ] Ajouter CTA vers /violence-prevention dans Home et LearnEI

### Tests
- [ ] Tests Vitest pour detectCrisis étendu (violence keywords)
- [ ] Tests pour safety_plan CRUD
- [ ] 0 erreur TypeScript

## Phase 16: Violence Prevention & Crisis Alert Modules

### Backend
- [x] Extend crisis detection: add violence-toward-others keywords (English + French)
- [x] Add `violence_flags` table (userId, checkInId, flagType, severity, triggerText, acknowledged, institutionId)
- [x] Add `safety_plans` table (userId, trustedContacts JSON, warningSignals, copingStrategies, safeEnvironments, professionalSupport)
- [x] tRPC crisis router: detectRealtime, reportFlag, getMyFlags, acknowledgeFlag, getInstitutionFlags, getSafetyPlan, saveSafetyPlan
- [x] DB helpers: createViolenceFlag, getViolenceFlagsByUser, getViolenceFlagsByInstitution, acknowledgeViolenceFlag, getSafetyPlanByUser, upsertSafetyPlan
- [x] Vitest tests: violence keyword detection, severity scoring, safety plan CRUD (105 tests passing)

### Frontend — Crisis Support Page (/crisis-support)
- [x] Full-screen alert with emergency contacts (3114, 988, 741741, 15, 17)
- [x] Severity-based messaging (self-harm vs. violence-toward-others)
- [x] Reconnect card with breathing exercise and grounding steps
- [x] Link to violence prevention plan

### Frontend — Violence Prevention Page (/violence-prevention)
- [x] Personal safety plan builder (warning signals, coping strategies, safe environments, professional support)
- [x] Trusted contacts manager (add/remove contacts with name, phone, relation)
- [x] Educational section: understanding violence signals, de-escalation strategies
- [x] Save safety plan to backend (authenticated users)

### Frontend — Check-In Flow Integration
- [x] Extend CRISIS_KEYWORDS with violence-toward-others keywords (English + French)
- [x] Detect violence type (self vs. toward-others) and set crisisType state
- [x] Crisis modal: differentiated messaging for self-harm vs. violence-toward-others
- [x] Add 3114 (France) to emergency contacts in crisis modal
- [x] Add "Voir les ressources complètes" → /crisis-support button
- [x] Add "Plan de sécurité" → /violence-prevention button (violence type only)
- [x] French crisis modal text

### Frontend — Facilitator Dashboard Integration
- [x] Add "Violence Flags" tab with badge counter (unacknowledged flags)
- [x] Violence flags list: type badge (self_harm / violence_toward_others / crisis), severity badge, timestamp
- [x] "Marquer traité" button to acknowledge flags
- [x] Summary stats cards (Critique / Haute / Modérée counts)
- [x] Critical alert banner when critical flags exist

## Phase 17: Bug Fixes

- [x] Fix FORBIDDEN error on /facilitator for superadmin (institutionId: null): relax institutionId guard in facilitator and crisis routers to allow superadmin access with global or empty data

## Phase 18: Nav Fix & English Translation

- [x] Fix top navigation: keep horizontal top-nav for all users (logged in or not), never switch to vertical sidebar on public pages
- [x] Translate entire UI to American English: all pages, components, modals, error messages, labels, placeholders

## Phase 19: Admin View Toggle Button

- [x] Add quick-switch button on /dashboard for admin/superadmin: "Switch to Facilitator View" → /facilitator
- [x] Add quick-switch button on /facilitator for admin/superadmin: "Switch to My Dashboard" → /dashboard
- [x] Add toggle link in NavBar dropdown for admin/superadmin users

## Phase 20: My Profile Update

- [x] Extend DB schema: add bio, phone, timezone, language, avatarUrl, notificationsEnabled fields to users table
- [x] Add tRPC procedures: profile.getMe, profile.update, profile.getStats
- [x] Create /profile page: avatar, personal info form, stats summary, preferences, account info
- [x] Add profile stats: total check-ins, current streak, best streak, achievements
- [x] Register /profile route in App.tsx

## Phase 21: Activate Facilitator Modules

- [x] Groups & Invitations: activate full group management UI (create group, list groups, invite students, copy invite link, view member count, group selector for invitations)
- [x] Violence Alerts: activate with anonymized identities, correct description banner, severity badges, Mark Resolved button
- [x] Crisis Alerts: activate with anonymized identities, correct description banner, severity badges, Mark Resolved button (resolveCrisisAlert tRPC mutation)

## Phase 22: Alert Filters

- [x] Add "Unresolved / All" toggle filter in Violence Alerts section
- [x] Add "Unresolved / All" toggle filter in Crisis Alerts section

## Phase 23: Alert Detail Pages

- [x] Add alert_actions table to DB schema (crisis_event_id or violence_flag_id, admin user, action type, note, timestamp)
- [x] Add DB helpers: getAlertActions, addAlertAction, getCrisisAlertById, getViolenceFlagById
- [x] Add tRPC procedures: crisis.getAlertDetail, crisis.addAction
- [x] Create /alert/crisis/:id and /alert/violence/:id pages (shared AlertDetail component) with full details, timeline, admin action form
- [x] Add "View Details" button from FacilitatorDashboard alert cards to detail pages
- [x] Register new routes in App.tsx

## Phase 24: Alert Assignment to Team Members

- [x] Extend DB schema: add assignedToId (userId FK) and assignedAt fields to crisis_events and violence_flags tables
- [x] Add DB helpers: assignCrisisAlert, assignViolenceFlag, getTeamMembers, getMyAssignedCrisisAlerts, getMyAssignedViolenceFlags
- [x] Add tRPC procedures: crisis.assignAlert, crisis.getTeamMembers, crisis.getMyAssignments
- [x] Update AlertDetail page: add "Assign to Team Member" dropdown + Assign button, show current assignee badge
- [x] Add "Assigned to Me" tab in FacilitatorDashboard with crisis and violence assignment lists
- [x] Register assignment action in alert_actions history (type: "Assigned")

## Phase 25: Alert Comments Section

- [x] Add alert_comments table to DB schema (alertType, alertId, authorId, content, createdAt, editedAt)
- [x] Add DB helpers: getAlertComments, addAlertComment, editAlertComment, deleteAlertComment
- [x] Add tRPC procedures: comments.getComments, comments.addComment, comments.editComment, comments.deleteComment
- [x] Add AlertCommentsSection component in AlertDetail.tsx: avatar initials, author name/role, timestamps, edit/delete own comments, Ctrl+Enter shortcut
- [x] Integrate AlertCommentsSection in both CrisisAlertDetail and ViolenceAlertDetail
- [x] Auto-refresh via trpc.useUtils().comments.getComments.invalidate on add/edit/delete

## Phase 26: Real-Time Notifications + Resend Email

- [ ] Configure RESEND_API_KEY secret
- [x] Add notifications table to DB schema (userId, type, title, body, link, read, createdAt)
- [x] Add DB helpers: createNotification, getNotificationsForUser, markNotificationRead, markAllRead
- [x] Create server/resend.ts email service with HTML templates for each event type
- [x] Add tRPC procedures: notifications.list, notifications.markRead, notifications.markAllRead, notifications.getUnreadCount
- [x] Trigger notifications on: new crisis alert, new violence flag, alert assigned, new comment, new student check-in
- [x] Create NotificationBell component in NavBar: badge with unread count, dropdown with recent notifications, polling every 30s
- [x] Create /notifications page with full history, read/unread filter, mark all read button
- [x] Register /notifications route in App.tsx

## Phase 28: Web Push Notifications (Browser Push API)
- [x] Generate VAPID key pair and store as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY secrets
- [x] Add push_subscriptions table to DB schema (userId, endpoint, p256dh, auth, createdAt)
- [x] Add DB helpers: savePushSubscription, deletePushSubscription, getPushSubscriptionsByUser, getPushSubscriptionsByInstitution
- [x] Add tRPC procedures: push.subscribe, push.unsubscribe
- [x] Create server/webpush.ts helper (web-push library, sendPushNotification)
- [x] Create public/sw.js Service Worker (push event handler, notification click → focus/open tab)
- [x] Create client/src/hooks/usePushNotifications.ts hook (request permission, subscribe, unsubscribe)
- [x] Add "Browser Push Notifications" toggle in My Profile page
- [x] Wire push notifications into notifyAdmins helper (alongside in-app + email)
- [x] Wire push notification to assignee in crisis.assignAlert
- [x] Test end-to-end: trigger crisis alert → push notification appears in browser

## Phase 29: Alignement exact Check-In + Seven Mirrors + Écran résumé

- [x] Mettre à jour CHECKIN_STEPS dans shared/headcheckData.ts avec les 10 étapes exactes du document source
- [x] Ajouter guidanceCard (Step 6) et reflectionCard (Step 8) dans les données headcheckData.ts
- [x] Ajouter la carte "Why This Works" sur Step 10 dans headcheckData.ts
- [x] Mettre à jour SEVEN_MIRRORS dans shared/headcheckData.ts avec les 7 miroirs exacts du document source
- [x] Désactiver le bouton Continuer dans CheckIn.tsx tant qu'aucune sélection n'est faite
- [x] Afficher la carte de guidance sur Step 6 dans CheckIn.tsx
- [x] Afficher la carte de réflexion sur Step 8 dans CheckIn.tsx
- [x] Afficher la carte "Why This Works" sur Step 10 dans CheckIn.tsx
- [x] Ajouter le message conditionnel "Not yet" sur Step 9 dans CheckIn.tsx
- [x] Créer la page CheckInSummary.tsx avec les 5 sections du document source
- [x] Enregistrer la route /checkin/summary dans App.tsx
- [x] Modifier CheckIn.tsx pour rediriger vers /checkin/summary après complétion (avant /checkin/result/:id)
- [x] Modifier CheckInSummary.tsx pour naviguer vers /checkin/result/:id après lecture du résumé
