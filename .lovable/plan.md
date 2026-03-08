

# Dark Mode Audit: Build Fix + Dark Mode Issues

## Step 1: Fix Build Error (P0)

**File:** `src/contexts/AuthContext.tsx`

The `User` interface's `preferences` type is missing three properties that `Profile.tsx` uses: `preferredSide`, `primaryPaddle`, and `availability`. The fix is to extend the `preferences` type:

```typescript
preferences?: {
  playingDays?: string[];
  partnerPreference?: 'looking' | 'have-partner' | 'either';
  preferredSide?: string;
  primaryPaddle?: string;
  availability?: string[];
};
```

---

## Step 2: Hardcoded `bg-white` Breaking Dark Mode

These components use `bg-white` instead of `bg-card`, making them render as bright white boxes in dark mode:

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `src/components/tournaments/TournamentCard.tsx` | Line 62 | `bg-white` on outer card | Change to `bg-card` |
| `src/components/tournaments/TournamentCard.tsx` | Line 103 | `bg-white` on inner content area | Change to `bg-card` |
| `src/components/home/FeaturedTournamentsSection.tsx` | Line 95 | `bg-white` on status badge | Change to `bg-card` |

---

## Step 3: Hardcoded Gray Text Breaking Dark Mode

The `WaitlistStatus.tsx` component uses hardcoded `text-gray-*` classes throughout, which don't adapt in dark mode (they remain dark gray on a dark background, becoming invisible):

| Line | Current Class | Fix |
|------|--------------|-----|
| 86 | `text-gray-900` | `text-foreground` |
| 89 | `text-gray-600` | `text-muted-foreground` |
| 94 | `text-gray-500` | `text-muted-foreground` |
| 99 | `text-gray-500` | `text-muted-foreground` |
| 112 | `text-gray-500` | `text-muted-foreground` |
| 142 | `text-gray-600` | `text-muted-foreground` |
| 147 | `text-gray-500` | `text-muted-foreground` |

Additionally, the card background colors use hardcoded light-only values:
| Line | Current | Fix |
|------|---------|-----|
| 61 | `bg-green-50/50` | `bg-green-50/50 dark:bg-green-950/30` |
| 62 | `bg-red-50/50` | `bg-red-50/50 dark:bg-red-950/30` |
| 63 | `bg-yellow-50/50` | `bg-yellow-50/50 dark:bg-yellow-950/30` |

---

## Step 4: FeaturedTournamentsSection Dark Mode Polish

**File:** `src/components/home/FeaturedTournamentsSection.tsx`

The "OPEN"/"LIVE" badge (line 95) uses `bg-white` which looks correct on a photo overlay but should stay white intentionally. However the status badge text class uses a string template without dark mode consideration -- this is acceptable since it's on a white badge.

No changes needed here beyond the `bg-white` to `bg-card` fix for the badge (keeping it light on dark photos is intentional, so actually keep `bg-white` here -- it sits on an image overlay). Only fix the outer card wrapper if needed -- already uses `bg-card`, so this section is fine except for line 95's badge which is intentionally white on a photo.

**Revised:** No changes needed for FeaturedTournamentsSection -- re-checking shows it already uses `bg-card` for card bodies. The `bg-white` badge on line 95 sits over a photo with dark gradient overlay so white is correct.

---

## Step 5: Signup Page Spacer

**File:** `src/pages/Signup.tsx` (line 77)

There's a `<div className="h-6" />` orphan spacer that pushes content down unnecessarily (same issue previously found in Login). Remove it.

---

## Summary of All Changes

| Priority | File | Change |
|----------|------|--------|
| P0 | `src/contexts/AuthContext.tsx` | Add `preferredSide`, `primaryPaddle`, `availability` to User preferences type |
| P1 | `src/components/tournaments/TournamentCard.tsx` | Replace `bg-white` with `bg-card` (2 occurrences) |
| P1 | `src/components/registration/WaitlistStatus.tsx` | Replace all `text-gray-*` with semantic tokens + add dark mode card backgrounds |
| P2 | `src/pages/Signup.tsx` | Remove orphan spacer div |

