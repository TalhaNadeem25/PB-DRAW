

# UI Audit: Fixes & Refinements

## Step 1: Fix Build Error (P0)

**File:** `src/pages/Discover.tsx`
- Add missing import: `import { SkeletonGrid } from "@/components/ui/skeleton-card";`

---

## Step 2: Font System Memory Correction

The project memory incorrectly states the display font is **Syne**. The actual font loaded in `index.css` and configured in `tailwind.config.ts` is **Oswald**. The memory note will be corrected to:
- **Oswald** (`font-display`) for headings, buttons, stats, nav labels
- **DM Sans** (`font-sans`) for body text, inputs, descriptions

---

## Step 3: Login Page Audit Fixes

| Issue | Fix |
|-------|-----|
| **Non-functional social buttons** -- Google and Apple buttons have no `onClick`, misleading users and hurting conversion | Add `disabled` state with `opacity-50 cursor-not-allowed` and a tooltip/title saying "Coming Soon" |
| **Password toggle missing aria-label** | Add `aria-label="Toggle password visibility"` to the eye/eye-off button |
| **Dead `group-hover` on Remember Me label** | Remove `group-hover:text-foreground` -- no parent has the `group` class so the hover does nothing |
| **Orphan spacer div** (`<div className="h-6" />` at line 40) | Remove it -- the Layout already handles spacing and this pushes content down unnecessarily on mobile |
| **Mobile branding is weak** | The right panel on mobile has only a tiny logo. Add a subtle `bg-gradient-to-b from-primary/5 to-transparent` to the form wrapper on mobile to give brand context |

---

## Step 4: Navbar Fixes

| Issue | Fix |
|-------|-----|
| **Brand mismatch** -- Says "PICKLEPLAY" but app is "Pickle Rally" | Change line 84 from `PICKLE<span>PLAY</span>` to `PICKLE<span> RALLY</span>` |
| **Broken link** -- "Payment History" points to `/my-tickets` | Change to `/tickets` (the actual route) |
| **Mobile hamburger missing aria-label** | Add `aria-label="Toggle navigation menu"` to the button at line 290 |
| **Icon-only nav links lack accessible names** | Add `aria-label={link.label}` to each desktop nav icon link |

---

## Step 5: Footer Contrast Fix

**File:** `src/components/layout/Footer.tsx`
- Change any `text-slate-400` instances to `text-muted-foreground` for WCAG AA compliance on the card background.

---

## Summary

| Priority | Change | Files |
|----------|--------|-------|
| P0 | Fix Discover.tsx build error (add SkeletonGrid import) | 1 |
| P1 | Fix Login accessibility (aria-label, disable social buttons, remove dead classes) | 1 |
| P1 | Fix Navbar (branding, broken link, aria-labels) | 1 |
| P2 | Fix Footer contrast | 1 |
| P2 | Correct font system memory note | Memory |

