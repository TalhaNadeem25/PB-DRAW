# PB Draw — Brand Assets

Production-ready SVGs. All built on a 1px-aligned grid, no rounded corners (iOS/Android apply their own icon masks).

## Files

| File | Use | Notes |
| --- | --- | --- |
| `mark.svg` | Primary mark on light surfaces | `#0F0F0E` strokes + `#C2691A` dot |
| `mark-light.svg` | Mark for use on dark/court backgrounds | `#F5F2EB` strokes + `#C2691A` dot |
| `mark-mono.svg` | Single-color fallback (no amber) | For print, embossing, foil stamps |
| `icon-1024.svg` | App icon — iOS / Android / Play Store | Solid `#1F4A2E` tile, edge-to-edge, **no white frame** |
| `lockup-horizontal.svg` | Default brand lockup | Mark + hairline + PB + DRAW |
| `wordmark-stacked.svg` | When mark is shown separately | PB stacked over DRAW |

## Colors

| Role | Hex |
| --- | --- |
| Ink | `#0F0F0E` |
| Paper (cream surface) | `#F5F2EB` |
| Court (brand green) | `#1F4A2E` |
| Amber (live / champion node) | `#C2691A` |

## App icon — Capacitor config

```ts
SplashScreen: {
  launchShowDuration: 1200,
  launchAutoHide: true,
  backgroundColor: "#1F4A2E",   // matches icon-1024 tile
  androidScaleType: "CENTER_CROP",
  showSpinner: false,
  splashFullScreen: true,
  splashImmersive: true,
}
```

For the iOS LaunchScreen storyboard, drop `mark-light.svg` centered on a solid `#1F4A2E` background. Don't add a white frame.

## Rasterizing

The SVGs are vector. To generate the standard density buckets:

```bash
# iOS app icons (App Store needs 1024, system handles the rest)
rsvg-convert -w 1024 icon-1024.svg > icon-1024.png
rsvg-convert -w 180  icon-1024.svg > icon-180.png   # iOS @3x
rsvg-convert -w 120  icon-1024.svg > icon-120.png   # iOS @2x

# Android
rsvg-convert -w 512  icon-1024.svg > play-store-512.png
rsvg-convert -w 192  icon-1024.svg > icon-192.png   # xxxhdpi

# Favicon
rsvg-convert -w 32   icon-1024.svg > favicon-32.png
rsvg-convert -w 16   icon-1024.svg > favicon-16.png
```

If you don't have `rsvg-convert`, `npx sharp-cli -i icon-1024.svg -o icon-180.png resize 180` works too.

## Wordmark fonts

The lockup SVGs reference web fonts. For frozen/exported assets (Play Store, etc.), outline the text in your vector tool first — otherwise the wordmark falls back to system fonts.

| Font | Weight | Use |
| --- | --- | --- |
| Bricolage Grotesque | 800 italic | "PB" |
| Geist Mono | 600 | "DRAW" |

Both are free on Google Fonts.
