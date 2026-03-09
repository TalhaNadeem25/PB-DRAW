

# Phosphor Icons Migration Plan

## Scope

Full replacement of `lucide-react` with `@phosphor-icons/react` across **~55 files** (20 UI primitives, 8 home/layout, 16 tournament, 10 dashboard, 20+ pages).

## Icon Mapping

Phosphor uses a different naming convention. Key mappings:

| Lucide | Phosphor |
|--------|----------|
| `Trophy` | `Trophy` |
| `Users` | `Users` |
| `Loader2` | `SpinnerGap` (with `className="animate-spin"`) |
| `ChevronRight` | `CaretRight` |
| `ChevronLeft` | `CaretLeft` |
| `ChevronDown` | `CaretDown` |
| `ChevronUp` | `CaretUp` |
| `ArrowRight` | `ArrowRight` |
| `ArrowLeft` | `ArrowLeft` |
| `X` | `X` |
| `Check` | `Check` |
| `Eye` | `Eye` |
| `EyeOff` | `EyeSlash` |
| `Search` | `MagnifyingGlass` |
| `Mail` | `Envelope` |
| `Bell` | `Bell` |
| `Calendar` | `Calendar` |
| `Clock` | `Clock` |
| `MapPin` | `MapPin` |
| `Star` | `Star` |
| `Heart` | `Heart` |
| `Home` | `House` |
| `User` | `User` |
| `UserCircle` | `UserCircle` |
| `LogIn` | `SignIn` |
| `LogOut` | `SignOut` |
| `Menu` | `List` |
| `Settings` | `Gear` |
| `Trash2` | `Trash` |
| `Edit2` | `PencilSimple` |
| `Plus` | `Plus` |
| `PlusCircle` | `PlusCircle` |
| `Send` | `PaperPlaneRight` |
| `Sparkles` | `Sparkle` |
| `Brain` | `Brain` |
| `Zap` | `Lightning` |
| `Shield` | `Shield` |
| `Globe` | `Globe` |
| `BarChart3` | `ChartBar` |
| `TrendingUp` | `TrendUp` |
| `TrendingDown` | `TrendDown` |
| `Award` | `Medal` |
| `Medal` | `Medal` |
| `Crown` | `Crown` |
| `LayoutGrid` | `GridFour` |
| `Grid3X3` | `GridNine` |
| `LayoutDashboard` | `SquaresFour` |
| `Radio` | `Broadcast` |
| `Wifi` | `Wifi` |
| `WifiOff` | `WifiSlash` |
| `AlertCircle` | `WarningCircle` |
| `AlertTriangle` | `Warning` |
| `Info` | `Info` |
| `CheckCircle` / `CheckCircle2` | `CheckCircle` |
| `XCircle` | `XCircle` |
| `DollarSign` | `CurrencyDollar` |
| `CreditCard` | `CreditCard` |
| `Ticket` | `Ticket` |
| `Download` | `DownloadSimple` |
| `Printer` | `Printer` |
| `FileText` | `FileText` |
| `FileSpreadsheet` | `Table` |
| `ClipboardCheck` / `ClipboardList` | `ClipboardText` |
| `Share2` | `ShareNetwork` |
| `ThumbsUp` | `ThumbsUp` |
| `Lock` | `Lock` |
| `Camera` | `Camera` |
| `CameraOff` | `CameraSlash` |
| `FlipHorizontal` | `ArrowsLeftRight` |
| `Keyboard` | `Keyboard` |
| `Scan` | `Scan` |
| `RotateCcw` | `ArrowCounterClockwise` |
| `RefreshCcw` | `ArrowsClockwise` |
| `Undo` | `ArrowUUndo` |
| `Dot` | `DotOutline` |
| `Circle` | `Circle` |
| `MoreHorizontal` | `DotsThree` |
| `GripVertical` | `DotsSixVertical` |
| `PanelLeft` | `SidebarSimple` |
| `Layers` | `Stack` |
| `Activity` | `Pulse` |
| `Target` | `Target` |
| `Apple` | `AppleLogo` |
| `Chrome` | `GoogleChromeLogo` |
| `HelpCircle` | `Question` |
| `Moon` | `Moon` |
| `Sun` | `Sun` |
| `Quote` | `Quotes` |
| `Square` | `Square` |
| `ListOrdered` | `ListNumbers` |
| `CheckCheck` | `Checks` |
| `UserPlus` | `UserPlus` |
| `Copy` | `Copy` |

## Phosphor Advantage

Phosphor icons support a `weight` prop (`thin`, `light`, `regular`, `bold`, `fill`, `duotone`) out of the box -- no separate fill variants needed. This gives the app a more distinctive visual identity than Lucide's single-weight stroke style.

## Execution Plan

### Step 1 — Install + remove
- Install `@phosphor-icons/react`
- Remove `lucide-react` from dependencies

### Step 2 — UI primitives (20 files)
Replace imports in all `src/components/ui/*.tsx` files: `accordion`, `breadcrumb`, `calendar`, `carousel`, `checkbox`, `command`, `connection-status`, `context-menu`, `dialog`, `dropdown-menu`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `radio-group`, `resizable`, `select`, `sheet`, `sidebar`, `toast`

### Step 3 — Layout components (4 files)
`Navbar.tsx`, `MinimalNavbar.tsx`, `Footer.tsx`, `MobileNav.tsx`

### Step 4 — Home sections (8 files)
`HeroSection`, `FeaturesSection`, `TestimonialsSection`, `CTASection`, `SocialProofBar`, `FeaturedTournamentsSection`, `HowItWorksSection`, `AIPlannerSection`

### Step 5 — Tournament components (16 files)
All files in `src/components/tournament/` and `src/components/tournament-detail/`

### Step 6 — Dashboard components (12 files)
All files in `src/components/tournament-dashboard/`, `src/components/dashboard/`, plus standalone components (`ProtectedRoute`, `NotificationCenter`, `NotificationListener`, `QRScanner`, `ConnectAccountButton`, `WaitlistButton`, `WaitlistStatus`, `CancelRegistrationDialog`)

### Step 7 — Pages (20+ files)
All page files in `src/pages/` that import lucide-react

### Step 8 — Cleanup
- Remove `lucide-react` from `package.json`
- Verify build succeeds

## Notes
- Phosphor uses `size` prop (same as Lucide) and `color` prop — minimal API change
- `className` pass-through works the same way
- `animate-spin` on `SpinnerGap` replaces `Loader2`'s built-in animation

