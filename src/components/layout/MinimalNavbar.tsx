import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, SignIn } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { PbLogo, PbAvatar } from "@/components/ui/pb";
import { motion } from "framer-motion";

const MinimalNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "fixed top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-50 transition-all duration-300 rounded-[8px]",
          scrolled
            ? "bg-pb-surface/95 backdrop-blur-sm border border-pb-rule"
            : "bg-pb-surface/80 backdrop-blur-sm border border-pb-hairline"
        )}
      >
        <div className="px-4 sm:px-5">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/" className="shrink-0">
              <PbLogo size={15} />
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <NotificationCenter />
                  <Link to="/dashboard">
                    <PbAvatar name={user?.name ?? "U"} size={28} tone="court" />
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-[12px] font-mono text-pb-muted hover:text-pb-ink hover:bg-pb-surface2 transition-colors"
                >
                  <SignIn size={14} />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Spacer */}
      <div className="h-14 sm:h-[4.5rem]" />
    </>
  );
};

export default MinimalNavbar;
