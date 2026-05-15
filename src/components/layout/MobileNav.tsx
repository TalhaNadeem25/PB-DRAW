import { useState } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import {
  PlusCircle, Radio, MagnifyingGlass, User, Trophy, Users,
  X, SquaresFour, Medal, Sparkle, GridNine, CreditCard,
  CaretRight, UserCircle, SignOut, SignIn, ChartBar, House, CalendarCheck,
} from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PbAvatar, Dot } from "@/components/ui/pb";

const hostOptions = [
  { href: "/create-tournament", icon: Trophy, label: "Tournament", desc: "Brackets, pools & elimination" },
  { href: "/leagues/create", icon: Users, label: "League", desc: "Sessions, standings & scheduling" },
];

const browseOptions = [
  { href: "/tournaments", icon: Trophy, label: "Tournaments", desc: "Find & join pickleball tournaments" },
  { href: "/leagues", icon: Medal, label: "Leagues", desc: "Browse & join local leagues" },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [showHostSheet, setShowHostSheet] = useState(false);
  const [showBrowseSheet, setShowBrowseSheet] = useState(false);
  const [showMeSheet, setShowMeSheet] = useState(false);

  const openHost = () => { haptics.light(); setShowHostSheet(true); };
  const openBrowse = () => { haptics.light(); setShowBrowseSheet(true); };
  const openMe = () => { haptics.light(); setShowMeSheet(true); };
  const closeSheets = () => { setShowHostSheet(false); setShowBrowseSheet(false); setShowMeSheet(false); };

  const pickHost = (href: string) => {
    haptics.medium();
    setShowHostSheet(false);
    navigate(href);
  };

  const pickBrowse = (href: string) => {
    haptics.medium();
    setShowBrowseSheet(false);
    navigate(href);
  };

  const handleNav = (href: string) => {
    haptics.light();
    closeSheets();
    navigate(href);
  };

  const handleLogout = () => {
    haptics.medium();
    closeSheets();
    logout();
    navigate("/");
  };

  const isOrganizer = user?.role === "organizer" || user?.role === "admin";

  const mainLinks = [
    { href: "/live", label: "Live", icon: Radio, isLive: true },
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/leagues", label: "Leagues", icon: Medal },
    ...(isOrganizer ? [{ href: "/tournament-planner", label: "AI Planner", icon: Sparkle }] : []),
    { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  ];

  const accountLinks = [
    { href: "/profile", label: "Profile", icon: UserCircle, desc: "Edit your info" },
    { href: "/tickets", label: "Payments", icon: CreditCard, desc: "Receipts & history" },
    ...(isOrganizer ? [{ href: "/analytics", label: "Organizer HQ", icon: GridNine, desc: "Manage tournaments" }] : []),
  ];

  const navItems = [
    { key: "home",     href: "/",            label: "Home",      icon: House },
    { key: "live",     href: "/live",        label: "Live",      icon: Radio },
    { key: "browse",   href: null,           label: "Browse",    icon: MagnifyingGlass },
    ...(isOrganizer
      ? [{ key: "host",      href: null,           label: "Host",      icon: PlusCircle }]
      : [{ key: "myevents",  href: "/dashboard",   label: "My Events", icon: CalendarCheck }]
    ),
    { key: "me",       href: null,           label: "Me",        icon: User },
  ];

  const isBrowseActive = location.pathname.startsWith("/tournaments") || location.pathname.startsWith("/leagues");

  const isActive = (href: string) => {
    if (href === "/" || href === "/dashboard")
      return location.pathname === "/" || location.pathname === "/dashboard";
    return (
      location.pathname.startsWith(href) &&
      (href !== "/tournaments" || location.pathname === "/tournaments" || location.pathname.startsWith("/tournaments/"))
    );
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {(showHostSheet || showBrowseSheet || showMeSheet) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-pb-ink/40 z-[60]"
            onClick={closeSheets}
          />
        )}
      </AnimatePresence>

      {/* Host Sheet */}
      <AnimatePresence>
        {showHostSheet && (
          <motion.div
            key="host-sheet"
            data-host-sheet
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) setShowHostSheet(false); }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-pb-paper rounded-t-[12px] border-t border-pb-hairline pb-safe"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-pb-rule" />
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-display font-black text-[17px] uppercase tracking-tight text-pb-ink">Host an Event</p>
                <p className="text-[11px] font-mono text-pb-muted mt-0.5">What do you want to create?</p>
              </div>
              <button
                onClick={closeSheets}
                className="w-8 h-8 rounded-[6px] bg-pb-surface2 flex items-center justify-center text-pb-muted hover:text-pb-ink transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-4 pb-6 space-y-2">
              {hostOptions.map((opt, i) => (
                <motion.button
                  key={opt.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => pickHost(opt.href)}
                  className="w-full flex items-center gap-4 p-4 rounded-[6px] bg-pb-surface border border-pb-hairline hover:border-pb-rule active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-[6px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center shrink-0">
                    <opt.icon size={20} className="text-pb-court" weight="bold" />
                  </div>
                  <div>
                    <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">{opt.label}</p>
                    <p className="text-[11px] font-mono text-pb-muted mt-0.5">{opt.desc}</p>
                  </div>
                  <CaretRight size={14} className="text-pb-faint ml-auto" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browse Sheet */}
      <AnimatePresence>
        {showBrowseSheet && (
          <motion.div
            key="browse-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) setShowBrowseSheet(false); }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-pb-paper rounded-t-[12px] border-t border-pb-hairline pb-safe"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-pb-rule" />
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-display font-black text-[17px] uppercase tracking-tight text-pb-ink">Browse</p>
                <p className="text-[11px] font-mono text-pb-muted mt-0.5">What do you want to explore?</p>
              </div>
              <button
                onClick={closeSheets}
                className="w-8 h-8 rounded-[6px] bg-pb-surface2 flex items-center justify-center text-pb-muted hover:text-pb-ink transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-4 pb-6 space-y-2">
              {browseOptions.map((opt, i) => (
                <motion.button
                  key={opt.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => pickBrowse(opt.href)}
                  className="w-full flex items-center gap-4 p-4 rounded-[6px] bg-pb-surface border border-pb-hairline hover:border-pb-rule active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-[6px] bg-pb-court-tint2 border border-pb-hairline flex items-center justify-center shrink-0">
                    <opt.icon size={20} className="text-pb-court" weight="bold" />
                  </div>
                  <div>
                    <p className="font-display font-black text-[15px] uppercase tracking-tight text-pb-ink">{opt.label}</p>
                    <p className="text-[11px] font-mono text-pb-muted mt-0.5">{opt.desc}</p>
                  </div>
                  <CaretRight size={14} className="text-pb-faint ml-auto" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Me Sheet */}
      <AnimatePresence>
        {showMeSheet && (
          <motion.div
            key="me-sheet"
            data-me-sheet
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) setShowMeSheet(false); }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-pb-paper rounded-t-[12px] border-t border-pb-hairline pb-safe overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-pb-rule" />
            </div>

            <div className="overflow-y-auto max-h-[85vh]">
              {isAuthenticated ? (
                <>
                  {/* Profile header */}
                  <div className="bg-pb-court mx-4 mt-3 rounded-[6px] px-5 pt-4 pb-5 overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
                    <div className="relative flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="w-13 h-13 rounded-[6px] bg-white/15 border border-white/25 flex items-center justify-center">
                          <span className="text-[22px] font-display font-black text-white leading-none">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black text-white text-[17px] uppercase tracking-tight truncate">{user?.name}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="px-2 py-0.5 bg-white/15 border border-white/20 rounded-full text-[9px] font-mono text-white/90 uppercase tracking-wide">
                            {user?.role}
                          </span>
                          <span className="px-2 py-0.5 bg-white/15 border border-white/20 rounded-full text-[9px] font-mono text-white/90 uppercase tracking-wide">
                            {user?.skillLevel || "3.5"} NTRP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main nav links */}
                  <div className="px-4 pt-4 space-y-0.5">
                    <p className="text-[9px] font-mono tracking-[0.18em] text-pb-faint uppercase px-2 mb-2">Navigate</p>
                    {mainLinks.map((link, i) => {
                      const Icon = link.icon;
                      const active = isActive(link.href);
                      return (
                        <motion.button
                          key={link.href}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handleNav(link.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-all",
                            active ? "bg-pb-court-tint2 text-pb-court" : "text-pb-ink hover:bg-pb-surface"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0",
                            active ? "bg-pb-court/15" : "bg-pb-surface2"
                          )}>
                            <Icon size={15} weight={active ? "bold" : "regular"} />
                          </div>
                          <span className="font-display font-bold text-[13px] uppercase tracking-wide flex-1 text-left">{link.label}</span>
                          {(link as any).isLive && (
                            <Dot color="amber" size={6} pulse className="shrink-0" />
                          )}
                          <CaretRight size={13} className={cn("shrink-0", active ? "text-pb-court/60" : "text-pb-faint")} />
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Account links */}
                  <div className="px-4 pt-4 space-y-0.5">
                    <p className="text-[9px] font-mono tracking-[0.18em] text-pb-faint uppercase px-2 mb-2">Account</p>
                    {accountLinks.map((link, i) => {
                      const Icon = link.icon;
                      return (
                        <motion.button
                          key={link.href}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.04 }}
                          onClick={() => handleNav(link.href)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-pb-ink hover:bg-pb-surface transition-all"
                        >
                          <div className="w-7 h-7 rounded-[4px] bg-pb-surface2 flex items-center justify-center shrink-0">
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-display font-bold text-[13px] uppercase tracking-wide leading-none">{link.label}</p>
                            <p className="text-[10px] font-mono text-pb-muted mt-0.5">{link.desc}</p>
                          </div>
                          <CaretRight size={13} className="text-pb-faint shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Sign out */}
                  <div className="px-4 pt-3 pb-6 border-t border-pb-hairline mt-4 mx-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-destructive hover:bg-destructive/8 transition-all"
                    >
                      <div className="w-7 h-7 rounded-[4px] bg-destructive/10 flex items-center justify-center shrink-0">
                        <SignOut size={15} />
                      </div>
                      <span className="font-display font-bold text-[13px] uppercase tracking-wide">Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Not authenticated */
                <div className="px-4 py-6 space-y-3">
                  <p className="font-display font-black text-[20px] uppercase tracking-tight text-pb-ink px-1">Welcome</p>
                  <p className="text-[13px] font-mono text-pb-muted px-1 mb-4">Sign in to access your account, tournaments, and more.</p>
                  <button
                    onClick={() => handleNav("/login")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[6px] border border-pb-hairline text-pb-ink font-display font-bold text-[13px] uppercase tracking-wide hover:bg-pb-surface transition-all"
                  >
                    <SignIn size={15} />
                    Log In
                  </button>
                  <button
                    onClick={() => handleNav("/signup")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[6px] bg-pb-ink text-white font-display font-bold text-[13px] uppercase tracking-wide hover:bg-pb-ink/90 transition-all"
                  >
                    <User size={15} />
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <div className="mobile-nav-bar md:hidden fixed bottom-0 left-0 right-0 bg-pb-surface border-t border-pb-hairline z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <nav className="flex items-center justify-between h-[54px]">
          {navItems.map((item) => {
            if (item.key === "host") {
              return (
                <button
                  key="host"
                  onClick={openHost}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full h-full transition-colors",
                    showHostSheet ? "text-pb-ink" : "text-pb-faint hover:text-pb-ink"
                  )}
                >
                  {showHostSheet && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-1 rounded-[6px] bg-pb-surface2"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center gap-[3px]">
                    <item.icon size={19} weight={showHostSheet ? "bold" : "regular"} />
                    <span className="font-mono text-[9.5px] tracking-[0.06em] uppercase">{item.label}</span>
                  </motion.div>
                </button>
              );
            }

            if (item.key === "browse") {
              return (
                <button
                  key="browse"
                  onClick={openBrowse}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full h-full transition-colors",
                    showBrowseSheet || isBrowseActive ? "text-pb-ink" : "text-pb-faint hover:text-pb-ink"
                  )}
                >
                  {(showBrowseSheet || isBrowseActive) && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-1 rounded-[6px] bg-pb-surface2"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center gap-[3px]">
                    <item.icon size={19} weight={showBrowseSheet || isBrowseActive ? "bold" : "regular"} />
                    <span className="font-mono text-[9.5px] tracking-[0.06em] uppercase">{item.label}</span>
                  </motion.div>
                </button>
              );
            }

            if (item.key === "me") {
              return (
                <button
                  key="me"
                  onClick={openMe}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full h-full transition-colors",
                    showMeSheet ? "text-pb-ink" : "text-pb-faint hover:text-pb-ink"
                  )}
                >
                  {showMeSheet && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-1 rounded-[6px] bg-pb-surface2"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center gap-[3px]">
                    <item.icon size={19} weight={showMeSheet ? "bold" : "regular"} />
                    <span className="font-mono text-[9.5px] tracking-[0.06em] uppercase">{item.label}</span>
                  </motion.div>
                </button>
              );
            }

            const active = isActive(item.href!);
            return (
              <Link
                key={item.href}
                to={item.href!}
                onClick={() => haptics.light()}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full transition-colors",
                  active ? "text-pb-ink" : "text-pb-faint hover:text-pb-ink"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-1 rounded-[6px] bg-pb-surface2"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center gap-[3px]">
                  {item.key === "live" && !active && (
                    <div className="relative">
                      <item.icon size={19} weight="regular" />
                      <Dot color="amber" size={5} pulse className="absolute -top-0.5 -right-0.5" />
                    </div>
                  )}
                  {!(item.key === "live" && !active) && (
                    <item.icon size={19} weight={active ? "bold" : "regular"} />
                  )}
                  <span className="font-mono text-[9.5px] tracking-[0.06em] uppercase">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default MobileNav;
