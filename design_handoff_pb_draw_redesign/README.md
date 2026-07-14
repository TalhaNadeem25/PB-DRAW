# Handoff: PB Draw — Tournament Platform Redesign

## Overview

PB Draw is a redesign of a pickleball tournament platform (originally "Picklix"). The redesign repositions the product as an **editorial, broadcast-grade** tournament tool with the **bracket / draw view as the marquee surface**. Players discover tournaments, register, and spectate. Organizers run the draw, courts, and live scoring.

This handoff covers **14 surfaces** across web (1440 / 1600 / 1920 wide) and mobile (iPhone-sized).

## About the design files

The files in this bundle are **design references created in HTML + React (via inline Babel)**. They are prototypes showing the intended look and behavior — **not production code to copy directly**. Your task is to **recreate these designs in the target codebase's existing environment** (likely React + a CSS-in-JS or utility-class system), reusing its established components, design tokens, and routing patterns.

If no environment exists yet, pick a modern stack (suggested: Next.js + Tailwind + shadcn/ui + lucide-react) and implement the system there.

Do **not** ship the inline `style={{}}` objects from the JSX as-is. Translate them into your codebase's styling system once, in tokens (see "Design tokens" below), and build small, well-named primitives.

## Fidelity

**High-fidelity (hifi).** Pixel-perfect mockups with final colors, typography, spacing, copy, and interactions. Recreate UI pixel-to-pixel using your codebase's existing libraries; use the design tokens as the source of truth.

## Visual direction (the system)

The whole product is built on five decisions. If you only remember five things:

1. **Cream paper, white surfaces.** Page background `#F5F2EB` (paper) with cards on pure white `#FFFFFF`. Never use white-on-white; always cream-on-white.
2. **Bricolage Grotesque for display, Geist for body, Geist Mono for numerics.** Tight `-0.035em` to `-0.045em` letter-spacing on display sizes. Mono with `font-feature-settings: "tnum" 1` for tabular numerals on every score, time, seed, and stat.
3. **Court green `#1F4A2E` for advancement / wins, amber `#C2691A` for live state.** Amber gets the pulse animation. Everything else is ink-on-paper.
4. **Hairline rules, not heavy borders.** `1px solid #E5E0D5`. No drop shadows on cards. Compose with rules + tints.
5. **Mono eyebrows.** `text-transform: uppercase`, `letter-spacing: 0.14em`, color `#6B6863`, size `10–11px`. They appear above every section title and KPI block. This is the most repeated detail in the system.

## Surfaces

The HTML deck contains seven sections of design canvas. Each artboard listed below maps to one route/screen.

### Player surfaces

#### 1. Browse / discovery — `screen-browse-court.jsx` → `BrowseScreen`
- **Route:** `/tournaments`
- **Purpose:** Players find a tournament to register for.
- **Layout:** Top nav, then a hero band with eyebrow + headline + filter chips. Below: an editorial featured tournament hero (full-bleed dark card with live state) and a 2-column responsive grid of `TournamentRow` cards.
- **Filter chips:** This week / Doubles / Singles / Mixed / 4.0+. Active chip = ink fill, inactive = cream pill.
- **Each row:** Eyebrow (date), title (Bricolage 700 24px), location, format pills (court-tinted), entry price (mono), capacity bar, CTA `Register →`.

#### 2. Tournament detail — `screen-detail.jsx` → `DetailScreen`
- **Route:** `/tournaments/[id]`
- **Purpose:** Premium event page that closes the registration.
- **Layout:** Editorial hero (oversized Bricolage title, eyebrow with date + status, flanking metadata column), then sticky sub-nav (Overview / Schedule / Players / Bracket / Results), then an Overview block (event facts, venue, prizes, 2-column rules + format).
- **Hero CTA:** Court-green primary "Register a team" + outline "Save".

#### 3. Bracket / draw view — `screen-bracket.jsx` → `BracketScreen` ⭐ **The marquee**
- **Route:** `/tournaments/[id]/bracket`
- **Purpose:** The single most important surface. A 16-team single-elim draw, drawn broadcast-style.
- **Layout:** Header with event title + format toggle (Single / Double / Pool→Bracket), legend strip, then a full-width SVG bracket with real connectors.
- **Match cell:** Two stacked rows (team A, team B). Each row: seed badge (mono), team name (Bricolage 600), per-game scores (mono, tnum), winner gets a court-green left border accent. Cell state: `final` (white surface), `live` (amber tint + pulsing dot + current game score in big mono), `tbd` (faint dashed).
- **Connectors:** SVG paths drawn between rounds — right-angle joins, hairline color (`#E5E0D5`). Live matches get amber connectors.
- **Round headers:** Eyebrow (`R32 / R16 / QF / SF / F`) above each column, mono.

#### 4. Player dashboard — `screen-extras-1.jsx` → `PlayerDashboardScreen`
- **Route:** `/me`
- **Purpose:** Logged-in home. Next match front and center.
- **Hero:** Editorial "Good afternoon, Maya." (Bricolage 800 56px) + ink-card on the right showing next match countdown in amber mono.
- **Tabs:** Overview / Tournaments / Partners / Tickets / Messages.
- **Body:** 4-up KPI grid (DUPR, win %, tournaments, streak), upcoming tournaments list, partner invites rail, ticket cards with QR.

### The draw, resolved

#### 5. Pool standings — `screen-extras-1.jsx` → `PoolStandingsScreen`
- **Route:** `/tournaments/[id]/pools`
- **Purpose:** Round-robin standings for pool play day.
- **Layout:** 4 pool tables in a 2×2 grid. Each pool: header (name + advancement pill), columnar table (`# / TEAM / W / L / PF / PA / ± / advance-bar`).
- **Advancing teams:** small court-green vertical bar in the rightmost cell. Live pool gets amber tint and pulsing dot.
- **Footer:** Round-robin schedule strip — 6 cells in a hairline grid, one per match (final / live / upcoming).

#### 6. Score entry — `screen-extras-1.jsx` → `ScoreEntryScreen`
- **Route:** `/admin/courts/[n]/score`
- **Purpose:** Referee or self-scoring scoresheet.
- **Layout:** 1.4fr / 1fr split. Left = score sheet (live banner, two team blocks, rally log). Right = match metadata, quick actions (timeouts, medical pause, dispute), and a dark "Win probability" card.
- **ScoreCell primitive:** Pill-shaped block, mono "GM 1/2/3" eyebrow, 32px mono number. States: `active` (amber border + tint), `final` (cream surface), default (white).
- **Point button:** court-green primary, `+` icon. Side-out: outline. Undo last: ghost.

### Venue & operations

#### 7. Organizer command center — `screen-organizer.jsx` → `OrganizerScreen`
- **Route:** `/admin`
- **Purpose:** The operator's day-of dashboard.
- **Layout:** Top KPI strip (4 stats with deltas), 2-column body. Left: live courts grid (6 court tiles each showing current match + game score), schedule incidents feed. Right: registrations summary, pending payments, support tickets.
- **Court tile:** mono court number, live amber dot if in progress, current match teams (truncated), score in mono, time elapsed.

#### 8. Courtside scoreboard — `screen-browse-court.jsx` → `CourtDisplayScreen`
- **Route:** `/display/[court]` (1920×1080, fullscreen TV)
- **Purpose:** Spectator-facing scoreboard mounted at each court.
- **Layout:** Editorial — dark ink background, oversized Bricolage team names, gigantic mono game scores, tournament logo top-left, sponsor strip bottom. Server indicator (court-green dot) on the serving team.

### Tournament builder

#### 9. Create tournament wizard — `screen-extras-2.jsx` → `CreateScreen`
- **Route:** `/admin/new`
- **Purpose:** Six-step wizard for organizers. Currently shows step 3 ("Format").
- **Layout:** 280px step rail on the left (with done/active/upcoming states + a court-tinted "Draw assistant" suggestion card), form pane on the right.
- **Steps:** Basics → Events → Format → Courts & schedule → Pricing → Review.
- **Format step:** 6-card structure picker (Pool→Bracket, Single elim, Double elim, RR, Ladder, Custom). Selected card has ink border + ink-circle check badge top-right. Below: 3 numeric config cards (pools / teams / advance), then a stage-by-stage match-format table.
- **Footer:** Back / Continue buttons.

### Auth

#### 10. Sign in — `screen-extras-1.jsx` → `AuthScreen`
- **Routes:** `/signin`, `/signup` (single editorial layout, segmented toggle)
- **Layout:** 1.1fr / 1fr split. Left: editorial — logo, "No. 12 · May 2026" eyebrow, oversized "Show up. *Play to it.*" headline, three mono stats, testimonial. Right: sign-in form (segmented Sign in / Create toggle, email + password fields, remember me, forgot, primary CTA, OR rule, Apple + Google).

### Mobile

#### 11. Mobile browse — `screen-extras-2.jsx` → `MobileBrowse` (in `IOSDevice` 420×870)
- **Layout:** Logo + search/bell row, eyebrow + 38px headline, filter chip rail, scrolling list. Featured tournament = dark card with amber live pill at top of list.
- **Bottom tab bar:** floating ink pill, 5 icons (Explore / Live / Host / Partner / Me), mono labels.

#### 12. Mobile match ticket — `screen-extras-2.jsx` → `MobileTicket` (in `IOSDevice` 420×870)
- **Layout:** Back arrow + title row, event header, ticket card. Card has dark top half (next match + amber countdown), QR code middle, 4-up metadata grid bottom (entry / seed / pool / bracket).
- **Footer CTAs:** primary "I'm at Court 4" + ghost "Add to Apple Wallet".

### Design system

#### 13. Components reference — `screen-extras-2.jsx` → `ComponentsScreen`
- **Route:** `/styleguide` (internal)
- **Layout:** 2-column grid of cards. Type scale, color swatches, button variants/sizes, pills/badges, inputs, match cards.

## Components library

These are the primitives. All defined in `shell.jsx` (with `Field` in `screen-extras-1.jsx`). Recreate as your codebase's components.

### `Btn` — `<Btn variant size icon full>`
- **Variants:** `primary` (ink fill, white text), `court` (court-green fill), `amber` (amber fill, white text), `outline` (1px hairline, transparent), `ghost` (transparent, no border).
- **Sizes:** `sm` (28px tall, 12.5px text, 10/14 padding), `md` (36px, 13px), `lg` (44px, 14px).
- **Icon:** rendered before text, 13–14px from `Icon`.
- **Radius:** 6px.

### `Pill` — `<Pill tone mono>`
- **Tones:** default (cream surface), `court` (`#E6EDE6` bg, `#1F4A2E` text), `amber` (`#FBE8D5` bg, `#7C3F0A` text), `blue`, `ink` (ink fill, white text), `outline`.
- **`mono` prop:** swaps font to Geist Mono with `0.14em` letter-spacing, uppercase.
- **Use cases:** LIVE (amber + pulsing dot), seeds, court numbers, format tags, status.

### `Card` — `<Card padded={true|false} style>`
- White surface, 1px hairline border, 6–8px radius, no shadow.
- `padded={false}` for tables / multi-section cards where each section sets its own padding.

### `Eyebrow` — `<Eyebrow color>`
- The mono uppercase tagline. 10–11px, `0.14em` letter-spacing, `#6B6863` by default.
- Always above section titles, KPIs, and card headers. Most-repeated motif.

### `SectionHead` — `<SectionHead eyebrow title action dense>`
- Eyebrow + Bricolage 700 18–22px title + optional right-aligned action button. `dense` shrinks vertical padding.

### `KPI` — `<KPI label value delta>`
- Eyebrow label, mono 28–32px tnum value, optional caption delta.
- Used in 4-up grids with hairline dividers.

### `Dot` — `<Dot color size pulse>`
- Solid circle. `pulse={true}` triggers the amber-pulse animation (defined in the page-level `<style>`).

### `Avatar` — `<Avatar name size tone>`
- Initials avatar. `tone="paper"` is cream bg with ink text.

### `Icon` — `<Icon name size color strokeWidth>`
- Inline SVG icon set. Names used: `search`, `bell`, `chevron-right`, `arrow-right`, `plus`, `check`, `play`, `qr`, `bracket`, `share`, `filter`, `users`, `trophy`, `settings`.
- All stroke-based, `strokeWidth={1.6}` default, no fill.
- Use `lucide-react` in production — same visual weight.

### `Logo` — `<Logo size>`
- Wordmark. Bricolage 800, mono dot indicator.

### `TopNav` — `<TopNav active>`
- 56px tall, hairline bottom border, logo left, nav links (`browse / live / bracket / host / me`), search + avatar right.

### `MatchCard` — `<MatchCard match w>`
- Two-team match cell as used in bracket and component reference.
- `match` shape: `{ seed: [n,n], a: { name, score: [g1,g2], won }, b: { name, score, won }, court, time, state, liveScore? }`
- States: `final`, `live` (amber tint + dot + game-2 big mono score), `tbd` (dashed faint), `upcoming` (mono time stamp).

### `Field` — `<Field label value trailing>`
- Form field with mono uppercase label above an outlined input row.

### `ScoreCell` — `<ScoreCell label value active final>`
- Game-score block. 64×64ish. Mono label + 32px tnum number.

### `PoolCard` — `<PoolCard pool>`
- Round-robin standings table. See PoolStandings surface above.

## Design tokens

Pull these directly into your token file. Names match `TOKENS` in `shell.jsx`.

```js
const TOKENS = {
  // Surfaces
  paper:      '#F5F2EB',  // page background
  surface:    '#FFFFFF',  // cards
  surface2:   '#FBF9F4',  // recessed sub-surface (table headers)
  hairline:   '#E5E0D5',  // 1px borders, dividers
  rule:       '#D5CFBF',  // slightly stronger rule for input borders

  // Text
  ink:        '#0F0F0E',  // primary text
  ink2:       '#3A3833',  // secondary
  muted:      '#6B6863',  // tertiary, eyebrow default
  faint:      '#9C9890',  // disabled, placeholder

  // Brand
  court:      '#1F4A2E',  // court green — winners, advance, primary CTA in live contexts
  courtTint:  '#E6EDE6',  // court bg tint
  courtInk:   '#234A2F',  // text on courtTint
  amber:      '#C2691A',  // LIVE
  amberTint:  '#FBE8D5',  // amber bg
};

const FONTS = {
  display: "'Bricolage Grotesque', Georgia, serif",
  body:    "'Geist', system-ui, sans-serif",
  mono:    "'Geist Mono', ui-monospace, monospace",
};
```

### Type scale

| Role     | Family    | Size | Weight | Tracking | Use |
|----------|-----------|------|--------|----------|-----|
| Display XL | Bricolage | 76 | 800 | -0.045em | Auth hero |
| Display L  | Bricolage | 56 | 800 | -0.04em  | Page heroes |
| Display M  | Bricolage | 40 | 800 | -0.035em | Section heads |
| Heading L  | Bricolage | 32 | 700 | -0.03em  | Card titles |
| Heading M  | Bricolage | 22–24 | 700 | -0.025em | Match team names, blocks |
| Body L    | Geist     | 15 | 400/500 | -0.005em | Long-form copy |
| Body M    | Geist     | 13.5 | 500 | 0 | UI text |
| Body S    | Geist     | 12.5 | 500 | 0 | Captions, table cells |
| Mono num L | Geist Mono | 32–38 | 500 | -0.02em | Live scores, %, KPIs |
| Mono num M | Geist Mono | 13–14 | 500 | 0 | Table numbers, scores |
| Eyebrow   | Geist Mono | 10–11 | 500 | 0.14em | Above every section |

Apply `font-feature-settings: 'tnum' 1` on every Mono usage that contains numbers.

### Spacing

8px base. Common values: 4, 8, 12, 14, 18, 22, 24, 28, 32, 40.

### Radius

- 4px — chips, score cells, small surfaces
- 6px — buttons, inputs, most cards
- 8px — wizard cards
- 10–14px — mobile cards
- 999px — pills

### Shadows

There are essentially **no drop shadows** in this system. Composition uses hairlines + tints. The only exception: amber LIVE pulse animation (a fading box-shadow ring).

## Interactions & behavior

### Animations
- **Amber pulse** (`@keyframes pbpulse`): defined in `PB Draw.html` head. 1.5s loop, fading box-shadow ring. Applied to `<Dot pulse>` for LIVE state.
- **Bracket connectors:** static SVG. No animation.
- **Hover states:** buttons darken by ~6% via `oklch` shift; outline becomes filled cream. Card hover: hairline darkens to `#D5CFBF`.

### State transitions
- **Match `tbd → upcoming → live → final`:** progresses on real data; live adds amber tint + dot + big mono current-game score; final removes tint and adds court-green winner accent on the winning row.
- **Live → final:** crossfade of 200ms; the big mono live score shrinks back into per-game cells.

### Forms
- Email + password sign-in. No client-side validation rules baked in — wire up to your auth layer.
- The wizard's step rail is read-only progress; user advances via Continue button, not by clicking steps.

### Responsive
The mocks are at fixed widths (1440 web / 420 mobile). For implementation:
- ≥1280: full layouts as designed
- 768–1279: collapse 2-column body areas to single column; KPI grid becomes 2×2
- <768: switch to mobile shell — the iPhone screens are the source of truth for sub-768 behavior

## State management

Per-screen state needs (suggested):

| Screen | State |
|--------|-------|
| Browse | filter selection, search query, pagination cursor |
| Detail | tab (Overview / Schedule / Players / Bracket / Results) |
| Bracket | format toggle (Single / Double / Pool→Bracket), current round filter |
| Pool standings | active pool filter, tab (Pool play / Bracket / Schedule / Standings) |
| Score entry | live score (per game), serving team, rally log, timeouts used |
| Organizer | refresh interval for live data (30s WS or polling) |
| Player dashboard | active tab, partner invite responses |
| Create wizard | full draft (Basics, Events, Format, Courts, Pricing); step index; autosave timer |
| Auth | mode (signin / signup), form state |
| Mobile browse | filter chip, scroll position |

For live data (bracket, pool standings, organizer, court display, score entry), prefer a WebSocket subscription with optimistic local updates on point/sideout actions.

## Assets

- **Fonts:** Bricolage Grotesque, Geist, Geist Mono — all from Google Fonts. Preconnect tags in the HTML head.
- **Icons:** custom inline SVG. Replace with `lucide-react` using equivalent names — visual weight matches.
- **Imagery:** none yet. Hero photography slots exist in the detail page but mocks use solid color blocks. Source real venue photography when available.
- **Logo:** wordmark only. No glyph yet.

## Files in this bundle

- `PB Draw.html` — entry point. Wires up all screens into a `DesignCanvas`.
- `shell.jsx` — **start here.** All shared primitives (TOKENS, FONTS, Btn, Pill, Card, Eyebrow, Icon, MatchCard, etc.).
- `brand.jsx` — Logo + brand-mark.
- `screen-browse-court.jsx` — Browse + Courtside scoreboard.
- `screen-detail.jsx` — Tournament detail.
- `screen-bracket.jsx` — Bracket / draw view (the marquee).
- `screen-organizer.jsx` — Organizer command center.
- `screen-extras-1.jsx` — Pool standings, score entry, player dashboard, auth.
- `screen-extras-2.jsx` — Mobile screens, create wizard, components reference.
- `design-canvas.jsx` — pan/zoom canvas host (do not port; this is a presentation-only tool).
- `ios-frame.jsx` — iPhone bezel (do not port; presentation-only).

## Recommended implementation order

1. **Tokens + type + Icon set** — get Bricolage/Geist loaded, port `TOKENS`, swap to `lucide-react`.
2. **Primitives** — `Btn`, `Pill`, `Card`, `Eyebrow`, `SectionHead`, `KPI`, `Dot`, `Avatar`, `Field`. Build a Storybook page that mirrors `ComponentsScreen` so you can sign off the system before building screens.
3. **Auth + Player dashboard** — simplest screens, prove the layout/density.
4. **Browse + Detail** — content-driven, exercises `MatchCard` and editorial type.
5. **Bracket** — the marquee. Build the SVG connector layout; this is the hardest screen.
6. **Pool standings + Score entry** — live state, optimistic updates.
7. **Organizer + Courtside display** — internal/spectator surfaces.
8. **Create wizard** — multi-step form; lean on your form library (react-hook-form / zod).
9. **Mobile** — last; the iPhone screens are the responsive endpoint.

## Notes

- Match cell data shapes are documented inline in `shell.jsx` — read `MatchCard` to understand the canonical match object.
- The `TopNav` is the same component on every web screen with an `active` prop — port once.
- Don't recreate the `DesignCanvas` infrastructure; that's a tool for presentation, not the product.
- All copy in the mocks (team names, scores, times) is illustrative — replace with real data wiring.
