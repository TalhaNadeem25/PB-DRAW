import { useState } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { PlusCircle, Radio, MagnifyingGlass, User, Trophy, Users, X } from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/tournaments", label: "Explore", icon: MagnifyingGlass },
  { href: "/live", label: "Live", icon: Radio },
  { href: null, label: "Host", icon: PlusCircle }, // handled separately
  { href: "/dashboard", label: "Me", icon: User },
];

const hostOptions = [
  {
    href: "/create-tournament",
    icon: Trophy,
    label: "Tournament",
    desc: "Brackets, pools & elimination",
  },
  {
    href: "/leagues/create",
    icon: Users,
    label: "League",
    desc: "Sessions, standings & scheduling",
  },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showHostSheet, setShowHostSheet] = useState(false);

  const openHost = () => {
    haptics.light();
    setShowHostSheet(true);
  };

  const pickHost = (href: string) => {
    haptics.medium();
    setShowHostSheet(false);
    navigate(href);
  };

  return (
    <>
      {/* Bottom sheet overlay */}
      <AnimatePresence>
        {showHostSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setShowHostSheet(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              data-host-sheet
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[61] bg-background rounded-t-3xl border-t-2 border-border pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-display font-black text-lg uppercase tracking-tight">Host an Event</p>
                  <p className="text-xs text-muted-foreground mt-0.5">What do you want to create?</p>
                </div>
                <button
                  onClick={() => setShowHostSheet(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Options */}
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
          </>
        )}
      </AnimatePresence>

      {/* Nav bar */}
      <div className="mobile-nav-bar md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50 px-2 pb-safe">
        <nav className="flex items-center justify-between h-16">
          {navItems.map((item) => {
            const isHost = item.href === null;

            if (isHost) {
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
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-1 rounded-xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center">
                    <item.icon
                      className={cn("w-5 h-5", showHostSheet && "fill-primary/20")}
                      weight={showHostSheet ? "bold" : "regular"}
                    />
                    <span className="text-[10px] font-display font-bold tracking-wide uppercase">{item.label}</span>
                  </motion.div>
                </button>
              );
            }

            const isActive =
              location.pathname.startsWith(item.href!) &&
              (item.href !== "/tournaments" ||
                location.pathname === "/tournaments" ||
                location.pathname.startsWith("/tournaments/"));

            return (
              <Link
                key={item.href}
                to={item.href!}
                onClick={() => haptics.light()}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-1 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div whileTap={{ scale: 0.85 }} className="relative z-10 flex flex-col items-center">
                  <item.icon
                    className={cn("w-5 h-5", isActive && "fill-primary/20")}
                    weight={isActive ? "bold" : "regular"}
                  />
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
