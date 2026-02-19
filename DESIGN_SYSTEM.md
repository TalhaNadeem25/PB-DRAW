# PicklePlay Design System — Full Reference

## App Overview

A pickleball tournament management platform called **PicklePlay** (branded as "PICKLE RALLY" in footer). Built with React + TypeScript + Vite + Tailwind CSS + shadcn/ui. All pages wrap in `<Layout>` which provides a fixed Navbar + Footer.

---

## Color Palette (CSS custom properties in `src/index.css`)

| Token | Light Mode | Purpose |
|-------|------------|---------|
| `--primary` | hsl(145 70% 35%) — vibrant court green | Primary buttons, active states, links, icons |
| `--primary-foreground` | white | Text on primary bg |
| `--secondary` | hsl(45 95% 55%) — warm ball yellow | Accent badges, CTA highlights |
| `--background` | hsl(120 10% 98%) | Page background |
| `--card` | hsl(0 0% 100%) | Card backgrounds |
| `--foreground` | hsl(150 20% 10%) | Body text |
| `--muted` | hsl(120 10% 94%) | Muted backgrounds, empty progress bars |
| `--muted-foreground` | hsl(150 10% 45%) | Secondary text, labels |
| `--accent` | hsl(145 60% 92%) | Light green accent backgrounds |
| `--destructive` | hsl(0 84% 60%) | Delete buttons, error states |
| `--border` | hsl(120 10% 88%) | Card borders, dividers |
| `--court-green` / `--court-green-dark` | 145 70% 35% / 25% | Custom green for "Start Tournament" buttons |
| `--ball-yellow` | 45 95% 55% | Custom yellow accent |

Dark mode equivalents exist in `.dark {}` in index.css — same hue families, adjusted lightness.

---

## Gradients

- **bg-hero-gradient**: linear-gradient(135deg, court-green, court-green-dark) — Hero sections, active nav items, sidebar active states, progress bar fills, icon hover backgrounds, badge active states
- **bg-mesh-gradient**: Multi-point radial gradient for subtle page background patterns
- **bg-accent-gradient**: Yellow gradient for accent buttons
- **bg-success-gradient**: Green gradient for success states

---

## Typography

| Role | Font | Usage |
|------|------|-------|
| Display / Headings | `font-display` = Oswald (400–700) | All headings (h1–h6), stats numbers, badge text, nav labels, section titles, button text |
| Body | `font-sans` = Inter (400–700) | Paragraphs, descriptions, form labels, muted text |

Heading pattern: Always use `font-display font-bold` (or `font-black` for hero headlines). Headings have `tracking-tight` applied globally.

**Key font size patterns:**

- Page title: `text-3xl md:text-4xl font-display font-bold` (or `text-4xl md:text-5xl` for hero)
- Section heading: `font-display font-bold text-lg` or `text-xl` or `text-2xl`
- Stats numbers: `font-display font-bold text-3xl`
- Card titles: `font-display font-bold text-lg`
- Small labels: `text-sm text-muted-foreground`
- Tiny labels: `text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase`

---

## Card System

**Do not** use plain `<div>` with manual border/shadow. Use these established patterns:

| Class | Effect |
|-------|--------|
| `glass-card` | bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg — Static glassmorphic card |
| `glass-card-hover` | Same as glass-card + hover:bg-card/90 hover:border-primary/20 hover:shadow-float hover:-translate-y-1 — Interactive cards |
| `glass` | bg-card/60 backdrop-blur-xl border border-border/50 — Lighter glass (nav backgrounds, tab lists) |
| `glass-dark` | bg-foreground/10 backdrop-blur-xl border border-foreground/10 — On dark/gradient backgrounds |

**Card structure pattern:**

```jsx
<div className="glass-card-hover rounded-2xl p-6">
  {/* Optional gradient top accent */}
  <div className="h-1.5 bg-hero-gradient" />
  {/* Content */}
</div>
```

Standard card padding: `p-6` or `p-8`. Always `rounded-2xl`.

**Card with icon pattern (stats, info cards):**

```jsx
<div className="group glass-card-hover rounded-2xl p-8">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
    </div>
    <div>
      <div className="text-sm text-muted-foreground">Label</div>
      <div className="font-display font-bold text-xl">Value</div>
    </div>
  </div>
</div>
```

---

## Navbar (Fixed, Floating)

The navbar is fixed, positioned `top-4 left-4 right-4` with `rounded-2xl`. It floats above the page with glass effect.

- Every page already has a `<div className="h-24" />` spacer rendered by the Navbar component itself.
- Pages with a hero gradient section do **not** need an additional spacer — hero goes right after the navbar spacer.
- Dashboard-style pages (no hero) need the `h-24` spacer at the top of their content area.

---

## Page Layout Patterns

### Pattern A: Hero + Content (Player-facing pages)

- [Navbar (fixed floating)]
- [h-24 spacer (from Navbar)]
- [Hero: bg-hero-gradient py-10–12, floating orbs, court-pattern overlay] → [Container: back link, title, badges, action buttons]
- [Content: container mx-auto px-4 py-12] → [Grid lg:grid-cols-3 gap-8] → [Main lg:col-span-2 with Tabs] + [Sidebar: stack of glass-card items]

**Used in:** TournamentDetail (player view), event detail pages.

### Pattern B: Dashboard Layout (Organizer/Admin pages)

- [Navbar (fixed floating)]
- [h-24 spacer]
- [Container mx-auto px-4 py-6]
  - [TopBar: back button + page title + status badge + date + action buttons]
  - [Mobile: horizontal scrollable tab bar (lg:hidden)]
  - [Flex row gap-8]
    - [Left sidebar nav: w-64, hidden lg:block, sticky top-28, glass-card rounded-2xl]
    - [Main content: flex-1 min-w-0]

**Used in:** TournamentDetail (organizer view), AnalyticsDashboard, CourtManager, PoolManagement, EditTournament.

### Pattern C: Search/List Page (No hero)

- [Navbar] → [h-24 spacer]
- [Search bar: border-b border-border/60 bg-card/50, filters]
- [Content: container mx-auto px-4 py-8] → [Flex row gap-6] → [Main grid flex-1 sm:grid-cols-2 gap-5] + [Right sidebar hidden lg:block w-[320px] sticky top-24]

**Used in:** Tournaments, Live, FindPartner.

### Pattern D: Full-width Landing (Homepage)

- [Navbar] → [Full-bleed sections]: HeroSection, LogoStripSection, HowItWorksSection, FeaturedTournamentsSection.

### Pattern E: Form Pages (Auth, Create, Edit)

- [Navbar] → [h-24 spacer]
- [Centered container: max-w-2xl or max-w-4xl] → [glass-card rounded-2xl p-8] → [Form content]

**Used in:** Login, Signup, CreateTournament, EditTournament, Profile.

---

## Buttons (shadcn/ui Button variants)

| Variant | Style | Usage |
|---------|--------|--------|
| default | bg-primary text-primary-foreground | Primary CTA |
| outline | Bordered, transparent bg | Secondary actions, filters |
| ghost | No border/bg | Nav links, subtle actions |
| destructive | bg-destructive text-white | Delete actions |
| glass | Glass on gradient bg | Icon buttons on hero |
| accent | Yellow gradient | High-emphasis CTA ("Register Now") |
| hero | Green gradient with glow | Registration CTA in sidebar |

**Patterns:** Action buttons in top bars: `size="sm"` with icons. Icon-only: `size="icon"` variant="outline". Hero CTAs: `size="lg"` with `shadow-glow hover:shadow-glow-lg transition-shadow`. Always pair icons with text: `<Icon className="w-4 h-4 mr-2" /> Label`.

---

## Badges

- Status: `<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">`
- Skill level: `<Badge variant="accent">{level}+</Badge>`
- Category/format: `<Badge variant="outline" className="capitalize">{format}</Badge>`
- Count: `<Badge variant="secondary">{count} Available</Badge>`
- Live: Badge with animated ping dot.

---

## Progress Bars

```jsx
<div className="h-2 bg-muted rounded-full overflow-hidden">
  <div
    className={cn(
      "h-full rounded-full transition-all duration-500",
      percent >= 90 ? "bg-destructive" : percent >= 70 ? "bg-warning" : "bg-hero-gradient"
    )}
    style={{ width: `${percent}%` }}
  />
</div>
```

---

## Hover & Animation Effects

| Class | Effect |
|-------|--------|
| hover-lift | -translate-y-1 + shadow-float on hover |
| shadow-glow | 0 0 40px primary/20 green glow |
| shadow-glow-lg | Larger green glow |
| shadow-glow-yellow | Yellow glow for accent CTAs |
| shadow-float | Elevated float shadow |
| animate-fade-in | Fade + slide up on mount |
| animate-float | Gentle floating (6s loop) for orbs |
| animate-float-slow | Slower float (8s loop) |
| live-indicator | Red pulsing dot (CSS pseudo-elements) |

Staggered animations: `style={{ animationDelay: \`${index * 0.1}s\` }}` on lists of cards with `animate-fade-in`.

---

## Sidebar Navigation (Dashboard pages)

- Active: `bg-hero-gradient text-primary-foreground shadow-glow`
- Inactive: `text-muted-foreground hover:text-foreground hover:bg-muted/60`
- Container: `glass-card rounded-2xl sticky top-28 w-64 hidden lg:block p-3 space-y-1`
- Items: `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium`
- Mobile: `lg:hidden` horizontal scrollable bar with `scrollbar-hide`.

---

## Tab Lists (Content tabs)

```jsx
<TabsList className="w-full justify-start glass border border-border/50 p-1.5 rounded-xl gap-1">
  <TabsTrigger value="x" className="rounded-lg data-[state=active]:bg-hero-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
    Label
  </TabsTrigger>
</TabsList>
```

---

## Icon Usage

- All icons from `lucide-react`
- Nav/buttons: `w-4 h-4`
- Cards/stat boxes: `w-5 h-5`
- Empty states: `w-8 h-8` to `w-12 h-12` with `opacity-50`
- Icon color follows text; hover uses icon-in-rounded-box pattern.

---

## Empty States

```jsx
<div className="text-center py-12 text-muted-foreground">
  <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
  <p>Description text.</p>
</div>
```

Or with glass card:

```jsx
<div className="glass-card-hover rounded-2xl p-8 text-center text-muted-foreground">
  <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
  <p className="text-sm">Description text.</p>
</div>
```

---

## Loading States

```jsx
<div className="flex flex-col items-center justify-center py-20">
  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
  <p className="text-muted-foreground">Loading...</p>
</div>
```

---

## Filter Chips (list pages)

```jsx
<Button variant="outline" size="sm" className="h-9 rounded-full text-sm gap-1.5 font-medium border-border/80">
  <Icon className="w-3.5 h-3.5" />
  Label
  <ChevronDown className="w-3 h-3 text-muted-foreground" />
</Button>
```

Active filter pills: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium`

---

## Tournament Card (TournamentCard.tsx)

Structure: `bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5`

- Image area with gradient overlay (from-black/30 via-transparent to-transparent)
- LIVE badge top-left, Entry fee badge top-right
- Content: location (uppercase primary), name (font-display bold, hover:text-primary), date+skill, action buttons
- Primary CTA button + outline share icon button

---

## Dialog/Modal Pattern

Use shadcn Dialog or AlertDialog. Content: `max-w-2xl max-h-[90vh] overflow-y-auto`. Form layout: `space-y-4`, grid for fields, DialogFooter with Cancel (outline) + Submit (default).

**Alert Dialogs (destructive):**  
`<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">`

**Non-destructive (e.g. Start Tournament):**  
`className="bg-court-green text-white hover:bg-court-green-dark"`

---

## What to REMOVE from old pages

1. Old-style hero sections with massive gradient + floating orbs on dashboard/management pages — use compact TopBar (Pattern B) for organizer views.
2. Inline tab-heavy layouts on organizer pages — use sidebar nav + content switcher.
3. Plain `<div className="bg-white rounded-lg shadow p-4">` — use `glass-card-hover rounded-2xl p-6`.
4. Non-Oswald headings — use `font-display font-bold`.
5. Hardcoded colors (e.g. bg-green-500, text-green-600) — use `bg-primary`, `text-primary`, or `bg-hero-gradient`.
6. Static shadow-md on cards — use `glass-card-hover`.
7. Manual backdrop-blur — use `glass`, `glass-card`, or `glass-dark`.

---

## What to ADD to all pages

1. `<Layout>` wrapper on every page.
2. `animate-fade-in` on main content; staggered delays on lists.
3. `hover-lift` or `glass-card-hover` on interactive cards.
4. Icon-in-box pattern for stat/info (10×10 rounded-lg bg-primary/10, group-hover gradient).
5. Progress bars with 3-color system (green/yellow/red) where percentages are shown.
6. Consistent `container mx-auto px-4` for content width.
7. Responsive grid: `grid sm:grid-cols-2` or `grid lg:grid-cols-3 gap-6` or `gap-8`.
8. Status badges with dot indicator where status is displayed.
9. `scrollbar-hide` on horizontal scroll areas.

---

## Pages Status (Design System Compliance)

| Page | Status | Pattern |
|------|--------|---------|
| Index.tsx (Homepage) | Updated | D |
| Tournaments.tsx | Updated | C |
| TournamentDetail.tsx | Updated | A / B |
| Navbar.tsx | Updated | — |
| Footer.tsx | Updated | — |
| Live.tsx | Updated | C |
| FindPartner.tsx | Updated | C |
| Login.tsx | Updated | E |
| Signup.tsx | Updated | E |
| ForgotPassword.tsx | Updated | E |
| ResetPassword.tsx | Updated | E |
| Dashboard.tsx | Updated | B |
| Profile.tsx | Updated | E |
| Discover.tsx | Updated | — |
| MyTickets.tsx | Updated | — |
| NotFound.tsx | Updated | — |
| PaymentSuccess.tsx | Updated | — |
| Privacy.tsx | Updated | — |
| Terms.tsx | Updated | — |
| CreateTournament.tsx | Updated | E |
| LiveTournamentDetail.tsx | Updated | — |
| AnalyticsDashboard.tsx | Updated | B |
| EditTournament.tsx | Updated | E |
| Teams.tsx | Updated | — |
| CourtManager.tsx | Updated | B |
| PoolManagement.tsx | Updated | B |
| EventRegistration.tsx | Updated | — |
| TournamentPlanner.tsx | Updated | — |
| TournamentCommunications.tsx | Updated | B |




In TournamentDetails page -> registration tab -> when organizer remove it should also do refund as well. (Not completed) 
If event is full let user join the waitlist, if approved by organizerthen email them to pay and join the evnets.  (Partial Complete)

skill level should be in evnets 3.5-4.0 etc  (inComplete) - (user defined values)
new event: max player should be teams or player based on game type (Complete)

create new pool type : format of pool matches: game to 11 win by 2 .... (Full complete)
minimim game to 11 win by 1 annd 2 
game to 15 win by 1 and 2 
game to 21 win by 1 an d2 
2 of 3 all game 


Single Elim - must have (Not Complete)

Asking user if they want playoffs or not (Partial/complete)

Scores tab - filter by round 
Add how many court user have when creating a tournament and then use the same input and show them in the schedule and planner

Pool standing not updating 

when generating playoff must ask user how many players or team depending on the format they want to promote next 
generatation playoffs must ask pool matches format

add complete button 

add separate pool matches format semi, champion and bronze (complete)


semifinals winner -> will play for gold and silver or bronze (completed)