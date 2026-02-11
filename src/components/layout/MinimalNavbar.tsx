import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

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
      <nav
        className={cn(
          "fixed top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-50 transition-all duration-300 rounded-2xl",
          scrolled
            ? "bg-card/80 backdrop-blur-xl shadow-float border border-border/50"
            : "bg-card/60 backdrop-blur-lg border border-border/30"
        )}
      >
        <div className="px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-300">
                  <Trophy className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="font-display text-lg font-bold text-foreground tracking-wide whitespace-nowrap">
                PICKLE<span className="text-primary">PLAY</span>
              </span>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <NotificationCenter />
                  <Link
                    to="/dashboard"
                    className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center text-xs font-bold text-primary-foreground hover:shadow-glow transition-all duration-300"
                  >
                    {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                  </Link>
                </>
              ) : (
                <Button variant="ghost" size="sm" asChild className="gap-1.5 text-sm">
                  <Link to="/login">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-14 sm:h-[4.5rem]" />
    </>
  );
};

export default MinimalNavbar;
