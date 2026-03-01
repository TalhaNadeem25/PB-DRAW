# Full-Stack Audit — Remediation Plan

**Status:** In progress  
**Last updated:** From audit remediation session

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

### To Do

| # | Item | Files | Effort |
|---|------|--------|--------|
| 1.1 | Homepage: clear CTA hierarchy — hero one primary CTA "Browse Tournaments", de-emphasize or remove hero search | Index.tsx, maybe Layout | 2h |
| 1.4 | Login/Signup: single AuthPage for /login, /signup, /auth — remove dead Login.tsx/Signup.tsx or document | App.tsx, AuthPage, (remove unused) | 1h |
| 1.5 | Add aria-live for real-time score updates (Socket.IO) | SocketContext or Live/TournamentDetail components | 2h |
| 1.6 | Glassmorphism: reduce or scope so text contrast is OK (e.g. hero/cards) | global CSS or glass-card usages | 1h |
| 1.7 | Hero search: remove duplicate or make secondary; single primary CTA | Index.tsx | 1h |
| 1.8 | Mobile nav: improve discoverability (labels or tooltips) | Navbar.tsx | 1h |
| 1.9 | Tournament cards: empty state when no image (placeholder/illustration) | TournamentCard.tsx | 1h |
| 1.10 | Signup: fix "Step 1 of 2" / "Continue to Preferences" — either add Step 2 or change copy | Signup.tsx / AuthPage | 1h |
| 1.11 | Replace or remove fake social proof numbers | Index, Signup, Navbar, etc. | 2h |
| 1.12 | Navbar stat strip: remove or use real data (12 played, +0.05) | Navbar.tsx | 30m |

---

## Phase 2 — Conversion & Product

| # | Item | Effort |
|---|------|--------|
| 2.1 | Remove login wall: show Find Partner / Teams / etc. with CTA to sign up instead of redirect | ProtectedRoute or per-page | 2h |
| 2.2 | Urgency on cards: "3 spots left" in red, show deadlines | TournamentCard.tsx | 1h |
| 2.3 | Post-payment: clear next step (add to calendar, invite partner) | PaymentSuccess, RegistrationSuccess | 2h |
| 2.4 | Post-signup onboarding (welcome modal or 3-step flow) | New component + routing | 1 day |
| 2.5 | Real social proof or remove (DB counts or remove copy) | Backend + frontend | 2h |

---

## Phase 3 — Functionality & Engineering

### Critical
| # | Item | Effort |
|---|------|--------|
| 3.1 | Error boundaries per route (or per major section) | ErrorBoundary usage in App | 2h |
| 3.2 | favoritesAPI: ensure isFavorite/addFavorite exist and are typed in api.ts | api.ts | 30m |
| 3.3 | Tournament list: server-side filter/pagination or cap client fetch | Backend + Tournaments.tsx | 4h |
| 3.4 | Dashboard: avoid loading waterfall (sequential vs parallel, consider combined endpoint) | Dashboard.tsx | 1h |

### Medium
| # | Item | Effort |
|---|------|--------|
| 3.5 | Remove or use Framer Motion (dead weight) | package.json + imports | 30m |
| 3.6 | Code splitting: React.lazy() for heavy routes | App.tsx | 2h |
| 3.7 | Socket joinTournament: avoid duplicate joins (e.g. ref count or single join) | SocketContext / usage | 1h |

### Security / Long-term (document only for now)
| # | Item | Note |
|---|------|------|
| 3.8 | CSRF, httpOnly cookies, rate limiting | Architecture; document in plan |
| 3.9 | Role check: ensure backend enforces organizer routes | Audit backend |

---

## Execution Order (This Session)

1. **1.4** Login/Signup route cleanup  
2. **1.9** Tournament card empty state (no image)  
3. **1.10** Signup Step 2 / copy fix  
4. **1.11** Fake social proof — remove or real data  
5. **1.12** Navbar fake stat strip  
6. **1.6** Glassmorphism readability (targeted)  
7. **1.7** Hero: one primary CTA, reduce search prominence  
8. **1.5** aria-live for live scores  
9. **3.2** favoritesAPI in api.ts  
10. **3.1** Error boundaries per route  
11. **2.1** Login wall: show page + CTA (e.g. Find Partner)  
12. **2.2** Urgency on tournament cards  
13. **1.8** Nav discoverability  
14. **3.5** Framer Motion cleanup  
15. **3.6** Code splitting (lazy routes)  

Then larger refactors (1.2 Dashboard, 1.3 TournamentDetail) as separate follow-up tasks.

---

## Notes

- **TournamentDetail / Dashboard splits:** Do as multi-step refactors; create feature branches or incremental PRs.
- **Real data for social proof:** Implemented via GET /api/stats/public; SocialProofBar and CTASection use real counts when available.

### Security (3.8–3.9) — document only

- **3.8 CSRF / httpOnly / rate limiting:** (a) **CSRF:** App uses JWT in Authorization header (no cookie-based session); CSRF risk is lower but consider SameSite cookies and CSRF tokens if adding cookie auth. (b) **httpOnly:** JWT is in memory (e.g. localStorage) — move to httpOnly cookie in a dedicated security pass to reduce XSS exposure. (c) **Rate limiting:** `authLimiter`, `paymentLimiter`, `apiLimiter` and route-specific limiters are in place; review limits and add for sensitive GET endpoints if needed.
- **3.9 Organizer role enforcement:** Backend uses `authorize('organizer', 'admin')` on organizer-only routes (create/edit tournament, pools, playoffs, payments, etc.). Audit: ensure every route that mutates tournament/event/pool/registration data checks organizer or admin; document any gaps and fix in dedicated security pass.
