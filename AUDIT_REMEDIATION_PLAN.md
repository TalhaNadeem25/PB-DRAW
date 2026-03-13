# Full-Stack Audit — Remediation Plan

**Status:** Complete  
**Last updated:** Audit remediation finished

All planned remediation items have been implemented. Security items (3.8–3.9) are documented only; implement in a dedicated security pass when needed.

---

## Phase 1 — UX & Visual Design

### ✅ Done
- [x] Filter radio buttons: `bg-white` → `bg-primary-foreground` (dark mode) — Tournaments.tsx
- [x] index.css: Syne → Oswald comment
- [x] Sort select: add `bg-card` / `text-foreground` for dark mode
- [x] 401 interceptor: use React Router `navigate` instead of `window.location`
- [x] Dashboard: replace raw `fetch` with `api.get()` for tickets and waitlist
- [x] Tournament card: use `tournament.image` for uploaded image (Tournaments.tsx)
- [x] Tournament card: improve dark mode text (skill pill `text-foreground`)
- [x] **1.4** Login/Signup: single AuthPage; removed dead Login.tsx, Signup.tsx
- [x] **1.9** Tournament card empty state when no image (Trophy + “Tournament” label)
- [x] **1.10** Signup Step 2 / broken copy (removed with Signup.tsx; AuthPage uses “Create Account”)
- [x] **1.11** Fake social proof removed/replaced (Hero, AuthPage, Navbar, TournamentSidebar)
- [x] **1.12** Navbar stat strip: “Played”/“+0.05” → “—” and “Rating” label
- [x] **1.5** aria-live for real-time score updates (SocketContext + sr-only region)
- [x] **3.2** favoritesAPI confirmed defined in api.ts
- [x] **3.1** Error boundaries on Dashboard, TournamentDetail, PoolManagement, CreateTournament
- [x] **2.1** Login wall: Find Partner, Teams, Tickets show AuthGate (preview + sign-up CTA) when unauthenticated
- [x] **2.2** Urgency on cards: “X spots left” in red when ≤5; deadline urgency already present
- [x] **2.3** Post-payment: clear next step (View my tickets, Manage team links) — PaymentSuccess, RegistrationSuccess
- [x] **2.4** Post-signup onboarding: WelcomeOnboarding modal wired on Tournaments when `fromSignup`
- [x] **1.1 + 1.7** Hero: single primary CTA “Browse Tournaments”; search removed; secondary Host/Search link
- [x] **1.6** Glassmorphism: `.glass` / `.glass-dark` + Navbar `bg-card/95` for readability
- [x] **1.8** Nav discoverability: icon + label on desktop; “NEW” badge for Partner
- [x] **3.5** Framer Motion: removed from package.json (unused)
- [x] **3.6** Code splitting: all page routes use React.lazy() + Suspense with PageFallback in App.tsx
- [x] **3.7** Socket: ref-count for joinTournament/leaveTournament and joinMatch/leaveMatch to avoid duplicate joins
- [x] **3.4** Dashboard: single loading gate (dashboardLoading) + skeleton until all critical queries ready
- [x] **3.3** Tournament list: server-side filter, sort, pagination — backend supports status, search, sort, location, skillLevel, entryFeeMax, format; frontend uses page/limit and server total/pages
- [x] **2.5** Real social proof: GET /api/stats/public (tournamentsRun, organizersCount); SocialProofBar + CTASection use statsAPI.getPublic() and display real counts when available
- [x] **3.8–3.9** Security: documented in plan (see Notes — Security); implement in dedicated pass
- [x] **1.2** Dashboard: split into PlayerDashboard + OrganizerDashboard; useDashboardData hook; Dashboard.tsx renders OrganizerDashboard or PlayerDashboard by role
- [x] **1.3** TournamentDetail: split into PlayerTournamentView, OrganizerTournamentDashboard, shared TournamentAlertDialogs; TournamentDetail.tsx orchestrates data and renders one view + dialogs

---

## Phase 2 — Conversion & Product

All items in this phase are **done** (see Phase 1 Done list for 2.1–2.5).

---

## Phase 3 — Functionality & Engineering

All items in this phase are **done** or **documented** (see Phase 1 Done list for 3.1–3.9). Security (3.8–3.9) is documented in Notes below; implement in a dedicated security pass when needed.

---

## Notes

- **TournamentDetail / Dashboard splits:** Completed; Dashboard uses OrganizerDashboard + PlayerDashboard; TournamentDetail uses OrganizerTournamentDashboard + PlayerTournamentView + TournamentAlertDialogs.
- **Real data for social proof:** Implemented via GET /api/stats/public; SocialProofBar and CTASection use real counts when available.

### Security (3.8–3.9) — document only

- **3.8 CSRF / httpOnly / rate limiting:** (a) **CSRF:** App uses JWT in Authorization header (no cookie-based session); CSRF risk is lower but consider SameSite cookies and CSRF tokens if adding cookie auth. (b) **httpOnly:** JWT is in memory (e.g. localStorage) — move to httpOnly cookie in a dedicated security pass to reduce XSS exposure. (c) **Rate limiting:** `authLimiter`, `paymentLimiter`, `apiLimiter` and route-specific limiters are in place; review limits and add for sensitive GET endpoints if needed.
- **3.9 Organizer role enforcement:** Backend uses `authorize('organizer', 'admin')` on organizer-only routes (create/edit tournament, pools, playoffs, payments, etc.). Audit: ensure every route that mutates tournament/event/pool/registration data checks organizer or admin; document any gaps and fix in dedicated security pass.
