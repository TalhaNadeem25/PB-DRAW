# Picklix — Redesign Vision & Audit Plan

## Part 1: Architecture & Global Design
- [x] Shift design language from "Sports app trying to look techy" to "Premium sports marketplace"
- [x] Replace Inter font with `DM Sans` (keep Oswald for display/headings)
- [x] Refine Color Palette:
  - Keep Primary court green: `hsl(145 70% 35%)`
  - Update Surface: pure white cards on `#F7F8F4` warm-off-white background
  - Limit Accent yellow (`hsl(45 95% 55%)`) to true CTAs
  - Add Info blue (`hsl(220 80% 55%)`) for "upcoming" states
  - Add Amber (`hsl(30 95% 50%)`) for "in-progress" / "live" urgency
- [x] Remove glassmorphism from content cards (solid white with clean border `border-border` and subtle shadow)
- [x] Keep glass effect ONLY on floating navbar and modal overlays
- [x] Remove floating orbs/blob animations to improve performance / clarity
- [x] Fix color contrast on glass cards to pass WCAG AA

## Part 2: Page-by-Page Redesign

### Homepage
- [x] Introduce floating, glass navbar
- [x] Add Search Bar to half-viewport Hero section (Find. Play. Win.)
- [x] Add Social Proof Bar ("Used by clubs in 28 states · Avg rating: 4.8★")
- [x] Add "Live Now" pulsing banner strip for active tournaments
- [x] Add Featured Tournaments (horizontal scroll, large cards)
- [x] Replace "How it Works" section with Testimonials (player, organizer, club)
- [x] Remove LogoStripSection in production

### Tournaments & Discovery
- [x] Remove `Discover.tsx` entirely and merge functionality into `Tournaments.tsx`
- [x] Implement robust Filter Sidebar on Desktop (3-col results)
- [x] Implement Bottom Sheet Drawer for mobile filters
- [x] Redesign Tournament Cards (add spots remaining, urgency "3 days left", event types, remove share CTA from card)

### Player Dashboard
- [x] Split 51KB dashboard monolith into a tabbed interface:
  - Overview / My Tournaments / Partner / Tickets / Messages
- [x] Make "Next Match" the persistent top banner on the Overview tab
- [x] Move stats, upcoming events, and invitations into logical cards

### Organizer Dashboard
- [x] Change flat 8-item sidebar into a **Workflow-based progress checklist**:
  - Setup Phase (Info, Events, Players)
  - Pre-Tournament (Communications, Pool Setup, Court Assignment, Schedule)
  - Day-Of (Check-In, Live Scoring, Brackets)
  - Post-Tournament (Results, Refunds, Analytics)
- [ ] Remove "Test Data Panel" from production builds

### Authentication
- [x] Merge `Login.tsx` and `Signup.tsx` into a unified `AuthPage.tsx` with tabs
- [x] Implement Registration without a login wall (guest flow, collect info -> gate with login/signup at end)

## Part 3: Features & Integrations

### High Priority
- [ ] Mobile bottom tab bar for navigation (`[🏆 Explore] [🔴 Live] [+ Host] [👥 Partner] [👤 Me]`)
- [ ] DUPR rating integration (profiles and filters)
- [ ] Waitlist viral loop ("Share to jump the waitlist")
- [ ] Post-registration email confirmation (with ticket attached)
- [ ] Skill level explainer / quiz (vs USAPA rating guide)
- [ ] Spectator/public bracket URL (no-login view for fans/parents)

### Medium Priority
- [ ] Push notifications using Capacitor (e.g. "Your match starts in 30 mins")
- [ ] Club/Facility accounts for managing multiple tournaments
- [ ] Series/Circuit support
- [ ] Post-match score dispute flow for players
- [ ] Tournament photo gallery
- [ ] Display refund policy before registration
- [ ] In-app messaging for partner finder

### Mobile-Specific & "Nice to Have"
- [ ] Pull-to-refresh on `Live.tsx` and `Dashboard.tsx`
- [ ] Swipe to dismiss tournament cards
- [ ] Full-screen brightness-boost mode for QR code check-in (MyTickets)
- [ ] Match history timeline on player profile
- [ ] Weather integration on tournament detail page
- [ ] Apple/Google Wallet ticket integration
