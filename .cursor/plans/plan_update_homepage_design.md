 ---
name: "Plan: Update Homepage Design with Modern Layout"
overview: "Update the homepage to match the provided modern design while preserving existing color palette (HSL-based court green/yellow) and fonts (Oswald/Inter)"
todos:
  - id: update-navbar
    content: Update Navbar component to match new fixed header design with glass effect, keeping existing functionality and color system
    status: pending
  - id: update-hero
    content: Redesign HeroSection with background image, overlay gradient, and new layout structure while using existing colors
    status: pending
  - id: create-logo-strip
    content: Create new LogoStripSection component for the "Trusted by" section with logo placeholders
    status: pending
  - id: update-features
    content: Update HowItWorksSection to match new "How It Works" design with three feature cards (Discover, Compete, Win)
    status: pending
  - id: create-tournaments-carousel
    content: Create new FeaturedTournamentsSection component with horizontal scrolling carousel of tournament cards
    status: pending
  - id: update-footer
    content: Update Footer component to match new footer design with newsletter signup and updated layout
    status: pending
  - id: update-index
    content: Update Index.tsx to include new sections and remove/reorder existing ones
    status: pending
---

# Plan: Update Homepage Design with Modern Layout

## Overview

Update the homepage to match the provided modern, futuristic design while preserving the existing color palette (HSL-based court green primary and yellow secondary) and fonts (Oswald for display, Inter for sans-serif).

## Current State

- **Color System**: HSL-based variables in `src/index.css`
  - Primary: `hsl(145 70% 35%)` (court green)
  - Secondary: `hsl(45 95% 55%)` (ball yellow)
  - Background: `hsl(120 10% 98%)` light / `hsl(150 20% 6%)` dark
- **Fonts**: 
  - Display: Oswald (configured in `tailwind.config.ts`)
  - Sans: Inter
- **Components**: 
  - `src/pages/Index.tsx` - Main homepage
  - `src/components/layout/Navbar.tsx` - Navigation
  - `src/components/layout/Footer.tsx` - Footer
  - `src/components/home/HeroSection.tsx` - Hero section
  - `src/components/home/FeaturesSection.tsx` - Features grid
  - `src/components/home/HowItWorksSection.tsx` - How it works steps
  - `src/components/home/CTASection.tsx` - Call to action
  - `src/components/home/AIPlannerSection.tsx` - AI planner section

## New Design Requirements

The provided HTML design includes:
1. **Fixed Header**: Glass effect navbar with logo, navigation links, and action buttons
2. **Hero Section**: Full-screen hero with background image, overlay gradient, live badge, and CTA buttons
3. **Logo Strip**: "Trusted by" section with placeholder logos
4. **How It Works**: Three feature cards (Discover, Compete, Win) with icons and descriptions
5. **Featured Tournaments**: Horizontal scrolling carousel with tournament cards
6. **Footer**: Multi-column footer with newsletter signup, links, and social icons

## Implementation Strategy

### 1. Update Navbar Component
- **File**: `src/components/layout/Navbar.tsx`
- **Changes**:
  - Update to fixed top-0 positioning (remove top-4 offset)
  - Add glass effect styling (backdrop-blur with semi-transparent background)
  - Update logo to match new design (SVG icon + "Pickle Rally" text)
  - Simplify navigation links to match new design
  - Keep existing authentication logic and dropdown menus
  - Use existing color system (primary/secondary from CSS variables)

### 2. Redesign Hero Section
- **File**: `src/components/home/HeroSection.tsx`
- **Changes**:
  - Add background image with overlay gradient
  - Update layout to single column (remove right-side visual)
  - Add "Now Live" badge with animated pulse indicator
  - Update headline to "Your Tournament, Perfected." with underline accent
  - Update CTA buttons to match new design
  - Use existing color variables for all styling
  - Maintain responsive design

### 3. Create Logo Strip Section
- **File**: `src/components/home/LogoStripSection.tsx` (new)
- **Content**:
  - "Trusted by 50+ regional associations" text
  - Row of placeholder logo divs with hover effects
  - Use existing background colors and styling

### 4. Update How It Works Section
- **File**: `src/components/home/HowItWorksSection.tsx`
- **Changes**:
  - Replace 4-step layout with 3-card layout
  - Update cards to match new design (Discover, Compete, Win)
  - Add large background icons on hover
  - Update section header with toggle buttons (Players/Organizers)
  - Use existing color system and fonts

### 5. Create Featured Tournaments Section
- **File**: `src/components/home/FeaturedTournamentsSection.tsx` (new)
- **Content**:
  - Section header with "Upcoming Majors" title and navigation arrows
  - Horizontal scrolling carousel of tournament cards
  - Each card includes: image, badge, title, prize amount, date/location, register button
  - Use existing color system for all styling
  - Add hover effects matching design

### 6. Update Footer Component
- **File**: `src/components/layout/Footer.tsx`
- **Changes**:
  - Update to match new multi-column layout
  - Add newsletter signup form
  - Update social icons section
  - Update footer links structure
  - Use existing color system

### 7. Update Index Page
- **File**: `src/pages/Index.tsx`
- **Changes**:
  - Reorder sections: Hero → Logo Strip → How It Works → Featured Tournaments → Footer
  - Remove or relocate AIPlannerSection (if needed)
  - Remove CTASection (or integrate into hero)
  - Remove FeaturesSection (replaced by How It Works)

## Color Mapping

The new design uses:
- `primary: "#60df20"` → Map to existing `hsl(var(--primary))` (court green)
- `background-light: "#f9fafa"` → Map to existing `hsl(var(--background))` light mode
- `background-dark: "#1f242e"` → Map to existing `hsl(var(--background))` dark mode

All colors will use the existing CSS variable system to maintain consistency.

## Font Mapping

The new design uses "Epilogue" → Keep existing "Oswald" for display font and "Inter" for sans-serif.

## Key Considerations

1. **Preserve Functionality**: Keep all existing navigation, authentication, and routing logic
2. **Responsive Design**: Ensure all new components work on mobile, tablet, and desktop
3. **Accessibility**: Maintain proper semantic HTML and ARIA labels
4. **Performance**: Optimize images and animations
5. **Consistency**: Use existing utility classes and component patterns where possible

## Files to Create

- `src/components/home/LogoStripSection.tsx`
- `src/components/home/FeaturedTournamentsSection.tsx`

## Files to Modify

- `src/components/layout/Navbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/home/HeroSection.tsx`
- `src/components/home/HowItWorksSection.tsx`
- `src/pages/Index.tsx`

## Testing Checklist

- [ ] Navbar displays correctly with glass effect
- [ ] Hero section shows background image and overlay
- [ ] Logo strip section displays with placeholder logos
- [ ] How It Works section shows 3 cards correctly
- [ ] Featured tournaments carousel scrolls horizontally
- [ ] Footer displays with all sections
- [ ] All colors match existing palette
- [ ] All fonts use Oswald/Inter
- [ ] Responsive design works on all screen sizes
- [ ] Existing functionality (auth, navigation) still works
