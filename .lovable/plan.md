# Picklix UI/UX Sophistication Plan

## Upgrade 1: Hero Section — Add Visual Weight

The hero is currently text-only on a plain `bg-background`. For a premium sports marketplace, it needs a strong visual anchor.

**Changes to `HeroSection.tsx`:**

- Add a large decorative element on the right side (abstract court-line SVG pattern or gradient mesh) to fill the empty half of the viewport on desktop
- Add an animated stats counter row below the CTAs (e.g., "500+ Tournaments · 10K+ Players · 28 States") using `framer-motion` number counting animation
- Add a subtle gradient wash behind the hero text area for depth
- Make the headline responsive — currently `text-8xl` on lg which is aggressive; tighten to `text-7xl` max

---

## Upgrade 2: Page Transition Animations

Currently pages just pop in. Wrapping the `<Routes>` outlet with `framer-motion` `AnimatePresence` and a shared `PageTransition` wrapper component will give smooth fade+slide transitions between every route.

**New file: `src/components/layout/PageTransition.tsx**`

- Wrap children with `motion.div` using `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -8 }}`
- Apply to every `<Route>` element's component

---

## Upgrade 3: Tournament Card Micro-interactions

**Changes to `TournamentCard.tsx`:**

- Wrap the entire card in `motion.div` with `whileHover={{ y: -6, scale: 1.01 }}` and `whileTap={{ scale: 0.98 }}`
- Add a subtle shine/shimmer effect on hover (CSS pseudo-element gradient sweep)
- Animate the progress bar on mount using `framer-motion` (like FeaturedTournamentsSection already does)
- Add image zoom on hover (`group-hover:scale-105` on the background image)

---

## Upgrade 4: Features Section — Redesign to Bento Grid

The current 3-column grid is functional but generic. Convert to a bento-grid layout where the first two cards are larger (span 2 cols) and the rest fill in, creating visual hierarchy.

**Changes to `FeaturesSection.tsx`:**

- First card spans `md:col-span-2` with a larger icon area
- Add a subtle animated border glow on hover using the `animated-gradient-border` pattern already in CSS
- Add numbered step indicators (01, 02, etc.) for visual rhythm

---

## Upgrade 5: Footer — Add More Depth

**Changes to `Footer.tsx`:**

- Add a top-of-footer CTA banner ("Ready to play? Browse tournaments →") as a colored strip
- Add app download badges (App Store / Google Play) placeholder for the Capacitor builds
- Add a "Company" column with About, Blog, Careers links (even as placeholder)

---

## Upgrade 6: Mobile Bottom Nav — Active State Animation

**Changes to `MobileNav.tsx`:**

- Add `framer-motion` `layoutId` animated indicator (pill background) that slides between active tabs
- Add haptic-style scale animation on tap using `whileTap={{ scale: 0.9 }}`
- Increase icon active state contrast (fill the icon when active)

---

## Upgrade 7: Testimonials — Add Carousel on Mobile

**Changes to `TestimonialsSection.tsx`:**

- On mobile, convert the 3-column grid to a horizontal scroll carousel with snap points (matching FeaturedTournamentsSection pattern)
- Add quote marks as a decorative SVG element
- Add company/club logos below each testimonial for credibility

---

## Upgrade 8: Loading & Empty States

Add polished skeleton loaders and empty states across key pages:

- Tournaments page already has `SkeletonGrid` — add branded empty state when no results found (illustrated SVG + action CTA)
- Dashboard loading state should show content-shaped skeletons, not a spinner

---

## Summary of All File Changes


| Priority | File                                                   | Change                                                  |
| -------- | ------------------------------------------------------ | ------------------------------------------------------- |
| P0       | `src/services/api.ts`                                  | Add missing `picklixAIAPI` export                       |
| P0       | `src/components/tournament/PicklixAIChatInterface.tsx` | Fix type error on `.data`                               |
| P1       | `src/components/layout/PageTransition.tsx`             | New — animated page wrapper                             |
| P1       | `src/App.tsx`                                          | Wrap routes with PageTransition                         |
| P1       | `src/components/home/HeroSection.tsx`                  | Add visual anchor, stats counters, gradient             |
| P1       | `src/components/tournaments/TournamentCard.tsx`        | framer-motion hover/tap, image zoom, progress animation |
| P2       | `src/components/home/FeaturesSection.tsx`              | Bento grid layout, numbered steps                       |
| P2       | `src/components/layout/MobileNav.tsx`                  | Animated active indicator, tap animation                |
| P2       | `src/components/home/TestimonialsSection.tsx`          | Mobile carousel, decorative elements                    |
| P2       | `src/components/layout/Footer.tsx`                     | CTA strip, company column, app badges                   |
| P3       | `src/pages/Tournaments.tsx`                            | Branded empty state illustration                        |
