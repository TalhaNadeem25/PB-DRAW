

## Fix Build Error + Font Consistency Audit

### 1. Fix Build Error: OrganizerEventsPanel

**File:** `src/components/tournament-dashboard/OrganizerEventsPanel.tsx`

The file imports both `toast` from `"sonner"` (line 26) AND `useToast` from `"@/hooks/use-toast"` (line 27). Line 187 then shadows the sonner `toast` with `const { toast } = useToast()`, which does not have `.success()` or `.error()` methods.

**Fix:** Remove the `useToast` import (line 27) and the `const { toast } = useToast()` line (line 187). The sonner `toast` import already supports `.success()` and `.error()`. Also update the `WaitlistSettingsDialog` component prop type (line 85) to remove the `useToast` reference.

---

### 2. Font Consistency Pass

The design system uses two fonts:
- **Syne** (`font-display`) -- for headings, buttons, nav labels, badges
- **DM Sans** (`font-sans`) -- for body text, inputs, descriptions

The CSS base layer already applies `font-display` to all `h1`-`h6` and `button` elements automatically. However, many pages use `<p>`, `<span>`, or `<div>` elements styled as visual headings (large text sizes like `text-2xl`, `text-3xl`, etc.) without adding `font-display`. These need to be fixed for consistency.

**Pages/components needing `font-display` added to heading-like elements:**

| File | Issue |
|------|-------|
| `src/pages/PartnerCancellationResponse.tsx` | `h1` has `font-bold` but missing `font-display` (should be automatic via CSS, but explicitly adding ensures consistency with other pages) |
| `src/pages/OrganizerScanner.tsx` | Stat values (`text-2xl font-bold`) in `<p>` tags -- these are data, not headings, so they should use `font-display` for the bold number style to match dashboard patterns |
| `src/pages/EventRegistration.tsx` | Check for heading elements missing `font-display` |
| `src/pages/PaymentSuccess.tsx` | Check for heading elements missing `font-display` |
| `src/pages/MyTickets.tsx` | Check for heading elements missing `font-display` |
| `src/pages/FindPartner.tsx` | Check for heading elements missing `font-display` |
| `src/pages/Live.tsx` | Check for heading elements missing `font-display` |
| `src/pages/AnalyticsDashboard.tsx` | Check for heading elements missing `font-display` |
| `src/pages/PoolManagement.tsx` | Check for heading elements missing `font-display` |
| `src/pages/AcceptInvitation.tsx` | Check for heading elements missing `font-display` |
| `src/pages/ForgotPassword.tsx` | Check for heading elements missing `font-display` |
| `src/pages/ResetPassword.tsx` | Check for heading elements missing `font-display` |

**Rule to apply consistently:**
- Any text `text-xl` or larger that acts as a title/heading: add `font-display font-bold`
- Stat numbers (large bold numbers in dashboards/cards): add `font-display font-bold`
- Labels, badges, nav items: add `font-display font-semibold`
- Body text, descriptions, form labels: keep `font-sans` (default, no class needed)
- Form inputs, textareas: keep `font-sans` (already handled by CSS)

---

### 3. Update Memory Note

The project memory references "Oswald" and "Inter" as the font system, but the actual fonts are **Syne** and **DM Sans**. The memory note should be corrected to reflect reality.

---

### Summary

| Step | What | Files |
|------|------|-------|
| 1 | Fix OrganizerEventsPanel build error | 1 file |
| 2 | Font consistency pass across all pages | ~12-15 files |
| 3 | Update memory | Memory note |

