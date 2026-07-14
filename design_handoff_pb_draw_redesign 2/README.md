# Handoff: PB Draw — Picklix Full Redesign

## Overview

PB Draw is a complete UX/visual redesign of **Picklix**, the pickleball tournament management platform (formerly built as `pickle-rally`). This bundle covers the full product surface — discovery, registration, live play, organizer operations, leagues, social, content, and edge states — rendered as a single navigable design canvas.

The repo's prior direction was "sports app." The redesign commits to a different identity: **editorial-meets-broadcast** — a premium operations tool that respects the seriousness of tournament play while staying warm and brand-rich.

## About the Design Files

The files in this bundle are **design references created in HTML/JSX prototypes**. They show the intended look, layout, density, motion intent, and behavior — they are **not** production code to lift wholesale.

The implementation task is to **recreate these designs in the existing Picklix codebase** (React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase, per the repo's `package.json` and `DESIGN_SYSTEM.md`). Reuse the established stack and component primitives; only introduce new ones when the design calls for something that doesn't exist yet (e.g., the bracket connector, the score-entry sheet, the courtside scoreboard).

If you're starting from scratch in a different stack, treat the JSX as a faithful blueprint and pick the closest framework idioms in your environment.

## Fidelity

**High-fidelity.** Final type, color, spacing, density, and interaction direction are all locked. The developer should match the visual output of `PB Draw.html` as closely as possible, deviating only when the codebase's existing constraints make a 1:1 match impractical.

## Visual Direction (must-read)

A short list of the rules that hold every screen together:

- **Type system:** Display = **Bricolage Grotesque** (700–800, tight tracking `-0.03em` to `-0.045em`, occasional italic for accent). Body = **Geist Sans**. Mono = **Geist Mono** (used for scores, IDs, timestamps, table data, kbd-like eyebrows).
- **Color system (locked tokens, see "Design Tokens" below):**
  - `paper #F5F2EB` — base canvas (warm cream, never pure white)
  - `surface #FBFAF6` — card surface
  - `ink #1F1D1A` — primary text / inverse panel background
  - `court #2F5D4F` — primary action / "winning" / brand green (NOT bright lime — deep, considered)
  - `amber #C97A2C` — **live state only**. Pulse dots, "LIVE" badges, current-game highlight. Never used for ornament.
- **No glassmorphism, no orbs, no gradient blobs.** Flat colors, hairline rules (`#E8E4DA`), shallow elevation only when a card overlays another card.
- **Hairlines and eyebrows do a lot of the work.** 10–11px mono uppercase eyebrows with `0.14em` letter-spacing label every section. 1px `#E8E4DA` rules separate everything.
- **Mono numbers everywhere.** Scores, money, IDs, timestamps, percentages — all in Geist Mono, tabular figures.
- **Density:** card padding `22px`, section padding `28–32px`, list rows `~44–56px`. This is denser than a typical SaaS app — closer to a broadcast graphic or a print layout. Don't loosen it.

## Screens / Surfaces

The canvas is organized into named sections, each containing 1–N artboards. Listed in canvas order:

### 1. Discovery
- **Browse / Tournaments** (`screen-browse-court.jsx` → `BrowseScreen`)
  - Marketing hero ("Find your draw. Win it.") with editorial title scale (~96px).
  - Filter rail (date, level, format, distance) + ranked tournament list with cover art slot.
  - Replaces `Discover.tsx`.
- **Live brackets index** (`screen-extras-4.jsx` → handled via Spectator; the legacy `Live.tsx` index is folded into the Browse "Live now" rail).

### 2. Tournament
- **Tournament detail** (`screen-detail.jsx` → `DetailScreen`)
  - Event picker, format card, schedule, partner-needed list, registration sidecar.
  - Replaces `LiveTournamentDetail.tsx`.
- **Live bracket — marquee** (`screen-bracket.jsx` → `BracketScreen`)
  - 16-team single-elim with real SVG connectors, live state on in-progress matches, mono scoring.
  - Pool standings table + score-entry sheet variants (`screen-extras-2.jsx`).

### 3. Player
- **Player dashboard** (`screen-extras-1.jsx` → `PlayerDashboardScreen`)
  - Upcoming matches, results stripe, DUPR card, partner suggestions.
  - Replaces `Dashboard.tsx`.
- **Public player profile** (`screen-extras-3.jsx` → `PlayerProfileScreen`)
  - Replaces `Profile.tsx`.
- **Mobile ticket** (`screen-extras-2.jsx` → `MobileTicket`, rendered inside iOS frame)
  - Replaces `MyTickets.tsx`.

### 4. Social
- **Partner directory** (`screen-extras-3.jsx` → `PartnerScreen`) — replaces `FindPartner.tsx`.
- **Inbox / communications** (`screen-extras-3.jsx` → `InboxScreen`) — replaces `TournamentCommunications.tsx`.
- **Teams** (`screen-extras-4.jsx` → `TeamsScreen`) — replaces `Teams.tsx`.

### 5. Commerce & account
- **Checkout** (`screen-extras-3.jsx` → `CheckoutScreen`) — replaces `EventRegistration.tsx` / `Register.tsx`.
- **Payment success** (`screen-extras-4.jsx` → `PaymentSuccessScreen`) — replaces `PaymentSuccess.tsx` / `RegistrationSuccess.tsx`.
- **Settings** (`screen-extras-3.jsx` → `SettingsScreen`) — covers `DeleteAccount.tsx`, `Privacy.tsx` (links out), profile edit.

### 6. Operations (organizer-facing)
- **Organizer command center** (`screen-organizer.jsx` → `OrganizerScreen`)
  - Workflow checklist, live courts grid, draw assistant. Replaces parts of `CreateTournament.tsx` / `EditTournament.tsx` post-publish flow.
- **Tournament create** (`screen-extras-1.jsx` → `CreateScreen`) — replaces `CreateTournament.tsx`.
- **Pool standings + score entry** (`screen-extras-2.jsx` → `PoolStandingsScreen`, `ScoreEntryScreen`) — replaces `PoolManagement.tsx`.
- **Courtside scoreboard** (`screen-extras-2.jsx` → `CourtsideScreen`) — 1920×1080 TV view for the venue.
- **Analytics** (`screen-extras-4.jsx` → `AnalyticsScreen`) — replaces `AnalyticsDashboard.tsx`.
- **QR scanner / check-in** (`screen-extras-4.jsx` → `ScannerScreen`) — replaces `OrganizerScanner.tsx`.

### 7. Leagues
- **Leagues listing** (`screen-extras-4.jsx` → `LeaguesScreen`) — replaces `Leagues.tsx`.
- **League detail / standings** (`screen-extras-4.jsx` → `LeagueDetailScreen`) — replaces `LeagueDetail.tsx`.
  - (League manage / create league not redesigned — derive from organizer + create-tournament patterns.)

### 8. Onboarding & states
- **Auth** (`screen-extras-2.jsx` → `AuthScreen`) — replaces `AuthPage.tsx` / `Login.tsx` / `Signup.tsx`.
- **Skill quiz** (`screen-extras-4.jsx` → `SkillQuizScreen`) — replaces `SkillQuiz.tsx`.
- **404 / draw not found** (`screen-extras-4.jsx` → `NotFoundScreen`) — replaces `NotFound.tsx`.

### 9. Editorial
- **The Draw — magazine** (`screen-extras-4.jsx` → `BlogScreen`) — replaces `Blog.tsx`. Article reading view (`BlogPost.tsx`) and editor (`BlogEditor.tsx`) **not redesigned** — derive from the magazine surface.

### 10. Closer
- **Final results** (`screen-extras-3.jsx` → `ResultsScreen`) — podium + standings + awards. New surface, no direct legacy equivalent.

### 11. Design system
- **Components reference** (`screen-extras-2.jsx` → `ComponentsScreen`) — buttons, pills, inputs, avatars, score chips, eyebrows, etc.

## What is NOT in this redesign (intentional)

Lift the visual language and apply to these without a custom mock — they're standard form/legal/utility pages:

- Forgot password / reset password
- Accept invitation
- Partner cancellation response
- Privacy / Terms (long-form legal content; just paginate inside the standard shell)
- Delete account confirmation (small modal)
- Edit tournament (clone of Create with prefilled state)
- Blog post reading view (single-column article inside the magazine shell)
- Blog editor (admin form, low design value)
- League manage / create league (derive from Organizer + Create Tournament patterns)

## Design Tokens

Lifted directly from `brand.jsx` (`TOKENS`, `FONTS`):

### Color
```
--paper:        #F5F2EB   /* base canvas */
--surface:      #FBFAF6   /* cards on paper */
--surface-2:    #EFEBE0   /* depressed surface, tabs bg */
--ink:          #1F1D1A   /* primary text, inverse panel bg */
--ink-2:        #3A3833   /* secondary text */
--muted:        #6E6A62   /* tertiary text */
--faint:        #9C9890   /* labels, disabled */
--hairline:     #E8E4DA   /* dividers, card borders */
--rule:         #D8D2C5   /* heavier rule */
--court:        #2F5D4F   /* primary brand / action / winning */
--court-tint:   #E4ECE8   /* selected row, success bg */
--amber:        #C97A2C   /* LIVE state only */
--amber-tint:   #F5E6D2
```

### Typography
```
--font-display: 'Bricolage Grotesque', serif
--font-body:    'Geist', sans-serif
--font-mono:    'Geist Mono', monospace
```

Scale (display, used freely — these are headlines, not a strict ramp):
- Hero — `96px / 0.95 / -0.045em`
- Display — `64–76px / 0.96 / -0.04em`
- Section — `36–48px / 1.0 / -0.03em`
- Card title — `22–28px / 1.1 / -0.025em`

Scale (body):
- Body — `14–15px / 1.5 / 0em`
- Small — `12–13px`
- Eyebrow — `10–11px mono uppercase / 0.14em`

### Spacing & radius
- Card padding: `22px`
- Section padding: `28–32px`
- Card radius: `8–10px`
- Pill radius: `4px` (intentionally tight, not pill-shaped — a chip)
- Hairline width: `1px`

### Iconography
Single-stroke 1.5px line icons. See `Icon` component in `brand.jsx` for the inline-SVG set (`arrow-right`, `play`, `qr`, `check`, `bracket`, `bell`, `share`, `plus`, `settings`, `search`, `filter`, etc.). Replace with `lucide-react` (already in the codebase) — names mostly map 1:1.

## Components to build / port

These are the design primitives that show up across screens. They are defined in `brand.jsx`:

| Component       | Purpose                                                         |
| --------------- | --------------------------------------------------------------- |
| `<Logo>`        | PB Draw wordmark (Bricolage 700, italic D)                      |
| `<Eyebrow>`     | Mono uppercase label, used everywhere                            |
| `<Pill>`        | Chip — tones: `outline`, `court`, `amber`, `ink`. Always mono.   |
| `<Dot>`         | Status dot, optional pulse                                       |
| `<Btn>`         | Sizes `sm/md/lg`, variants `primary/outline/ghost/amber`         |
| `<Card>`        | Hairline-bordered surface, padded by default                     |
| `<SectionHead>` | Eyebrow + display title + optional action                        |
| `<KPI>`         | Mono number + label + delta                                      |
| `<Avatar>`      | Initial-based, tone `paper` or `ink`                             |
| `<TopNav>`      | Persistent app shell nav — see `shell.jsx`                       |
| `<ScoreCell>`   | Mono tabular score with winner emphasis                          |

## Interactions & Behavior

- **Live state pulse:** `<Dot pulse>` uses a 1.4s `opacity` keyframe (defined in `brand.jsx` `<style>` block). Pair with amber color, never green.
- **Bracket connectors:** SVG paths drawn between match cards. Live matches highlight their connector segment amber.
- **Score entry:** Sticky bottom sheet on mobile / right rail on desktop. Tap-to-increment, swipe to reverse last point.
- **Filter rail:** Sticky left rail on Browse, collapses to a horizontal bar < 768px.
- **Courtside scoreboard:** 1920×1080 fixed. Auto-cycles between courts every 12s if multiple games live.
- **Skill quiz:** 12 questions, single-answer, mono question key (A/B/C/D) chip. Progress bar at top. No timer.
- **QR scanner:** Camera viewport with amber detection frame, animated "scanning…" caption, last-scanned card with team details + queue list.

## State / Data

The legacy repo uses **Supabase** + **TanStack Query** (`@supabase/supabase-js`, `@tanstack/react-query` in `package.json`). Keep that pattern. The redesign does not change the data model — it changes the presentation. Per-screen, the data shapes you need are the same ones the existing pages already fetch.

Specifically out of scope for this redesign:
- Schema changes
- Auth flow logic (UI only)
- Payments integration (UI only — Stripe Checkout stays as-is)

## Assets

- **Fonts:** Bricolage Grotesque + Geist + Geist Mono are loaded from Google Fonts CDN in `PB Draw.html` (`<link>` in `<head>`). In production, self-host via `@fontsource/...` or use Google Fonts the existing way.
- **Icons:** Inline SVG in `brand.jsx`. Swap for `lucide-react` icons of the same name in implementation.
- **Imagery:** All "cover art" slots in mocks are colored fills (`court`, `ink`, `amber`) with stylized SVG court diagrams. Replace with real tournament cover photos from the existing Supabase `tournament_covers` bucket.

## Files in this bundle

| File                       | Contents                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `PB Draw.html`             | The entry — design canvas wiring all screens together                                     |
| `brand.jsx`                | Tokens, fonts, primitives (`Btn`, `Pill`, `Eyebrow`, `Icon`, etc.)                        |
| `shell.jsx`                | `TopNav` and the app shell chrome                                                          |
| `screen-bracket.jsx`       | Live bracket marquee                                                                       |
| `screen-browse-court.jsx`  | Discovery browse + courtside scoreboard                                                    |
| `screen-detail.jsx`        | Tournament detail                                                                          |
| `screen-organizer.jsx`     | Organizer command center                                                                   |
| `screen-extras-1.jsx`      | Player dashboard, Create tournament, Auth, mobile ticket                                  |
| `screen-extras-2.jsx`      | Pool standings, Score entry, Courtside, Components reference                              |
| `screen-extras-3.jsx`      | Player profile, Partner directory, Checkout, Settings, Inbox, Final results              |
| `screen-extras-4.jsx`      | Analytics, Leagues, League detail, Teams, Spectator, Scanner, Skill quiz, Success, Blog, 404 |
| `mobile-screens.jsx`       | Full mobile set — auth, dashboard, detail, bracket, score entry, spectator, partner, profile, checkout |
| `design-canvas.jsx`        | Canvas component (pan/zoom/focus) — only relevant for browsing the mock, not for impl    |
| `ios-frame.jsx`            | iOS device bezel used to wrap mobile mocks                                                |

## Recommended implementation order

1. **Tokens + primitives first.** Get Bricolage / Geist loaded and reproduce `Eyebrow`, `Pill`, `Btn`, `Card`, `Dot`, `KPI`, `TopNav` in the existing shadcn/ui flavor. Land these in a Storybook (or a `/style` route) before touching screens.
2. **Browse + Detail + Bracket.** The marquee experience. Validate the type stack and density choices on the highest-traffic pages.
3. **Organizer + Courtside + Score entry.** Validate the operations density. These are the screens that justify the redesign for paying customers.
4. **Player dashboard + Profile + Teams + Partner + Inbox.** Social/retention layer.
5. **Checkout + Auth + Settings + Success + 404.** Polish the edges.
6. **Analytics + Leagues + Spectator + Scanner.** Specialty surfaces.
7. **Editorial.** Brand layer — lowest priority.

## Open questions for the developer

- The legacy repo has an `AUDIT_REMEDIATION_PLAN.md`. Re-read it after this handoff — some items there (mobile responsiveness, accessibility, error states) overlap with the redesign and should be handled in the same pass.
- Some screens are designed at 1440px or 1920px. The mobile set (`mobile-screens.jsx`) covers the primary phone flows at 390px width — auth, home, browse, detail, live bracket, score entry, spectator, partner discovery, profile, checkout, ticket. Tablet sits between the two; derive by relaxing the mobile single-column to 2-up where it makes sense and respecting the desktop type scale at ~80%.

## Mobile design rules

- **390×800 internal canvas** (inside iPhone 14 bezel at 420×870).
- **16px gutters**, 14px card padding (denser than desktop's 22px).
- **Sticky top bar + sticky bottom tab bar** on all primary screens. CTAs live in a sticky action bar above the tab bar where applicable (detail, checkout).
- **Tab bar:** Home / Live / Browse / Inbox / Me. Mono caps labels, 9.5px. Active state = ink color, inactive = faint.
- **Score entry is full-bleed dark.** Two tap targets (team A green, team B paper), giant mono score numerals. This is the *only* mobile screen that uses the inverse dark surface — it's optimized for being held mid-game with sweat on the screen.
- **Auth is also dark** — sets up the brand reveal before the player crosses into the warm paper UI.
- **Tap targets minimum 44px**, scroll regions must not overlap the sticky bars (test with 5.5"–6.7" devices).
