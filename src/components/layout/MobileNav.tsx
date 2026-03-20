import { useState } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import {
  PlusCircle, Radio, MagnifyingGlass, User, Trophy, Users,
  X, SquaresFour, Medal, Sparkle, GridNine, CreditCard,
  CaretRight, UserCircle, SignOut, SignIn, Sun, Moon, ChartBar,
} from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const hostOptions = [
  { href: "/create-tournament", icon: Trophy, label: "Tournament", desc: "Brackets, pools & elimination" },
  { href: "/leagues/create", icon: Users, label: "League", desc: "Sessions, standings & scheduling" },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [showHostSheet, setShowHostSheet] = useState(false);
  const [showMeSheet, setShowMeSheet] = useState(false);

  const openHost = () => { haptics.light(); setShowHostSheet(true); };
  const openMe = () => { haptics.light(); setShowMeSheet(true); };
  const closeSheets = () => { setShowHostSheet(false); setShowMeSheet(false); };

  const pickHost = (href: string) => {
    haptics.medium();
    setShowHostSheet(false);
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
    { key: "explore", href: "/tournaments", label: "Explore", icon: MagnifyingGlass },
    { key: "live", href: "/live", label: "Live", icon: Radio },
    { key: "host", href: null, label: "Host", icon: PlusCircle },
    { key: "me", href: null, label: "Me", icon: User },
  ];

  const isActive = (href: string) =>
    location.pathname.startsWith(href) &&
    (href !== "/tournaments" || location.pathname === "/tournaments" || location.pathname.startsWith("/tournaments/"));

  return (
    <>
      {/* ── Backdrop ── */}
      <AnimatePresence>
        {(showHostSheet || showMeSheet) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/50 z-[60]"
            onClick={closeSheets}
          />
        )}
      </AnimatePresence>

      {/* ── Host Sheet ── */}
      <AnimatePresence>
        {showHostSheet && (
          <motion.div
            key="host-sheet"
            data-host-sheet
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-background rounded-t-3xl border-t-2 border-border pb-safe"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-display font-black text-lg uppercase tracking-tight">Host an Event</p>
                <p className="text-xs text-muted-foreground mt-0.5">What do you want to create?</p>
              </div>
              <button onClick={closeSheets} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pb-6 space-y-3">
              {hostOptions.map((opt, i) => (
                <motion.button
                  key={opt.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => pickHost(opt.href)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <opt.icon className="w-6 h-6 text-primary" weight="bold" />
                  </div>
                  <div>
                    <p className="font-display font-black text-base uppercase tracking-tight">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Me Sheet ── */}
      <AnimatePresence>
        {showMeSheet && (
          <motion.div
            key="me-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-background rounded-t-3xl border-t-2 border-border pb-safe overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="overflow-y-auto max-h-[85vh]">
              {isAuthenticated ? (
                <>
                  {/* Profile header */}
                  <div className="relative bg-hero-gradient px-5 pt-4 pb-5 mx-4 mt-3 rounded-2xl overflow-hidden">
                    <div className="absolute -right-5 -top-5 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
                    <div className="absolute left-0 bottom-0 w-16 h-16 bg-black/5 rounded-full blur-xl pointer-events-none" />
                    <div className="relative flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-display font-black text-white leading-none">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black text-white text-lg uppercase tracking-tight truncate">{user?.name}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="px-2 py-0.5 bg-white/15 border border-white/20 rounded-full text-[9px] font-display font-bold text-white/90 uppercase tracking-widest">
                            {user?.role}
                          </span>
                          <span className="px-2 py-0.5 bg-white/15 border border-white/20 rounded-full text-[9px] font-display font-bold text-white/90 uppercase tracking-widest">
                            {user?.skillLevel || "3.5"} NTRP
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { toggleTheme(); haptics.light(); }}
                        className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0"
                      >
                        {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nav links */}
                  <div className="px-4 pt-4 space-y-1">
                    <p className="text-[9px] font-display font-bold tracking-[0.2em] text-muted-foreground uppercase px-1 mb-2">Navigate</p>
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
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                            active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", active ? "bg-primary/20" : "bg-muted")}>
                            <Icon className="w-4 h-4" weight={active ? "bold" : "regular"} />
                          </div>
                          <span className="font-display font-bold text-sm uppercase tracking-wide flex-1 text-left">{link.label}</span>
                          {(link as any).isLive && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                          )}
                          <CaretRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Account links */}
                  <div className="px-4 pt-4 space-y-1">
                    <p className="text-[9px] font-display font-bold tracking-[0.2em] text-muted-foreground uppercase px-1 mb-2">Account</p>
                    {accountLinks.map((link, i) => {
                      const Icon = link.icon;
                      return (
                        <motion.button
                          key={link.href}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.04 }}
                          onClick={() => handleNav(link.href)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted/60 transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-display font-bold text-sm uppercase tracking-wide leading-none">{link.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{link.desc}</p>
                          </div>
                          <CaretRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Sign out */}
                  <div className="px-4 pt-4 pb-6">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <SignOut className="w-4 h-4" />
                      </div>
                      <span className="font-display font-bold text-sm uppercase tracking-wide">Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Not authenticated */
                <div className="px-4 py-6 space-y-3">
                  <p className="font-display font-black text-xl uppercase tracking-tight px-1">Welcome</p>
                  <p className="text-sm text-muted-foreground px-1 mb-4">Sign in to access your account, tournaments, and more.</p>
                  <button
                    onClick={() => handleNav("/login")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-border font-display font-bold text-sm uppercase tracking-wide hover:bg-muted/60 transition-all"
                  >
                    <SignIn className="w-4 h-4" />
                    Log In
                  </button>
                  <button
                    onClick={() => handleNav("/signup")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-wide hover:bg-primary/90 transition-all"
                  >
                    <User className="w-4 h-4" />
                    Create Account
                  </button>
                  <div className="flex items-center justify-between pt-2 px-1">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <button
                      onClick={() => { toggleTheme(); haptics.light(); }}
                      className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
                    >
                      {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Nav Bar ── */}
      <div className="mobile-nav-bar md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50 px-2 pb-safe">
        <nav className="flex items-center justify-between h-16">
          {navItems.map((item) => {
            if (item.key === "host") {
              return (
                <button
                  key="host"
                  onClick={openHost}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                    showHostSheet ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {showHostSheet && (
                    <motion.div layoutId="mobile-nav-pill" className="absolute inset-1 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center">
                    <item.icon className={cn("w-5 h-5", showHostSheet && "fill-primary/20")} weight={showHostSheet ? "bold" : "regular"} />
                    <span className="text-[10px] font-display font-bold tracking-wide uppercase">{item.label}</span>
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
                    "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                    showMeSheet ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {showMeSheet && (
                    <motion.div layoutId="mobile-nav-pill" className="absolute inset-1 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center">
                    <item.icon className={cn("w-5 h-5", showMeSheet && "fill-primary/20")} weight={showMeSheet ? "bold" : "regular"} />
                    <span className="text-[10px] font-display font-bold tracking-wide uppercase">{item.label}</span>
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
                  "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div layoutId="mobile-nav-pill" className="absolute inset-1 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center">
                  <item.icon className={cn("w-5 h-5", active && "fill-primary/20")} weight={active ? "bold" : "regular"} />
                  <span className="text-[10px] font-display font-bold tracking-wide uppercase">{item.label}</span>
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
