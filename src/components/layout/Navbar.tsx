import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, User, SignIn, SignOut, UserCircle, House, SquaresFour, Users, Radio, ChartBar, Sparkle, CaretRight, CaretDown, CreditCard, Gear, GridNine, Medal, MagnifyingGlass } from "@phosphor-icons/react";
import { Search, Bell, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PbLogo, PbAvatar, Dot } from "@/components/ui/pb";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { href: "/live", label: "Live", icon: Radio, isLive: true },
    ...(user?.role === 'organizer' || user?.role === 'admin'
      ? [{ href: "/tournament-planner", label: "AI Planner", icon: Sparkle }]
      : []
    ),
    { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  ];

  const isBrowseActive = location.pathname.startsWith("/tournaments") || location.pathname.startsWith("/leagues");

  const authenticatedNavLinks = isAuthenticated
    ? [
        { href: "/", label: "House", icon: House },
        ...navLinks,
      ]
    : navLinks;

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ── Desktop TopNav ─────────────────────────────────────────────────── */}
      <nav className="app-navbar hidden md:block fixed top-0 left-0 right-0 z-50 bg-pb-surface border-b border-pb-hairline">
        <div className="max-w-[1440px] mx-auto px-8 h-14 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <PbLogo size={17} />
          </Link>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {authenticatedNavLinks.map((link) => {
              const isLiveLink = (link as any).isLive;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-sans font-medium rounded-[6px] transition-colors duration-150",
                    isActive(link.href)
                      ? "text-pb-ink bg-pb-surface2"
                      : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
                  )}
                >
                  {isLiveLink && (
                    <Dot color="amber" size={6} pulse className="shrink-0" />
                  )}
                  {link.label}
                </Link>
              );
            })}

            {/* Browse dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-[13px] font-sans font-medium rounded-[6px] transition-colors duration-150 focus:outline-none",
                  isBrowseActive
                    ? "text-pb-ink bg-pb-surface2"
                    : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
                )}>
                  Browse
                  <CaretDown size={10} weight="bold" className="opacity-60 mt-px" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-48 p-1 bg-pb-surface border border-pb-hairline shadow-md rounded-[8px] z-50"
              >
                <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                  <Link to="/tournaments" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                    <Trophy className="w-3.5 h-3.5 text-pb-muted" /> Tournaments
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                  <Link to="/leagues" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                    <Medal className="w-3.5 h-3.5 text-pb-muted" /> Leagues
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              className="p-2 rounded-[6px] text-pb-muted hover:text-pb-ink hover:bg-pb-surface2 transition-colors"
              aria-label="Search"
            >
              <Search size={16} strokeWidth={1.6} />
            </button>

            <NotificationCenter />

            {isAuthenticated ? (
              <>
                {(user?.role === 'organizer' || user?.role === 'admin') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-sans font-medium bg-pb-court text-[#F2F8EE] rounded-[6px] hover:opacity-90 transition-opacity focus:outline-none">
                        + Host
                        <CaretDown size={10} weight="bold" className="opacity-75 mt-px" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-52 p-1 bg-pb-surface border border-pb-hairline shadow-md rounded-[8px] z-50"
                    >
                      <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                        <Link to="/create-tournament" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                          <Trophy className="w-3.5 h-3.5 text-pb-muted" /> Tournament
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                        <Link to="/leagues/create" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                          <Medal className="w-3.5 h-3.5 text-pb-muted" /> League
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pb-court">
                      <PbAvatar name={user?.name ?? "U"} size={30} tone="court" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    className="w-52 p-1 bg-pb-surface border border-pb-hairline shadow-md rounded-[8px] z-50"
                  >
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-pb-hairline mb-1">
                      <p className="text-[13px] font-medium text-pb-ink truncate">{user?.name}</p>
                      <p className="text-[11px] text-pb-muted mt-0.5 capitalize">{user?.role} · {user?.skillLevel ?? '—'}</p>
                    </div>

                    <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                      <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                        <SquaresFour className="w-3.5 h-3.5 text-pb-muted" /> Dashboard
                      </Link>
                    </DropdownMenuItem>

                    {(user?.role === 'organizer' || user?.role === 'admin') && (
                      <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                        <Link to="/analytics" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                          <GridNine className="w-3.5 h-3.5 text-pb-muted" /> Organizer HQ
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                      <Link to="/tickets" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                        <CreditCard className="w-3.5 h-3.5 text-pb-muted" /> Payments
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="cursor-pointer rounded-[6px]">
                      <Link to="/profile" className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-pb-ink2">
                        <Gear className="w-3.5 h-3.5 text-pb-muted" /> Settings
                      </Link>
                    </DropdownMenuItem>

                    <div className="border-t border-pb-hairline mt-1 pt-1">
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer rounded-[6px] flex items-center gap-2 px-2 py-1.5 text-[13px] text-destructive focus:text-destructive focus:bg-destructive/8"
                      >
                        <SignOut className="w-3.5 h-3.5" /> Sign out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[13px] font-sans font-medium text-pb-ink2 hover:text-pb-ink transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-sans font-medium bg-pb-ink text-white rounded-[6px] hover:opacity-90 transition-opacity"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-[6px] text-pb-muted hover:text-pb-ink hover:bg-pb-surface2 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} strokeWidth={1.6} /> : <Menu size={20} strokeWidth={1.6} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden border-t border-pb-hairline"
            >
              <div className="px-6 py-4 space-y-1 bg-pb-surface max-h-[calc(100vh-3.5rem)] overflow-y-auto">
                {authenticatedNavLinks.map((link) => {
                  const isLiveLink = (link as any).isLive;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 text-[14px] font-medium rounded-[6px] transition-colors",
                        isActive(link.href)
                          ? "text-pb-ink bg-pb-surface2"
                          : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {isLiveLink && <Dot color="amber" size={6} pulse />}
                      {link.label}
                    </Link>
                  );
                })}
                <Link
                  to="/tournaments"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-[14px] font-medium rounded-[6px] transition-colors",
                    isActive("/tournaments") ? "text-pb-ink bg-pb-surface2" : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Trophy className="w-4 h-4" /> Tournaments
                </Link>
                <Link
                  to="/leagues"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-[14px] font-medium rounded-[6px] transition-colors",
                    isActive("/leagues") ? "text-pb-ink bg-pb-surface2" : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Medal className="w-4 h-4" /> Leagues
                </Link>

                <div className="pt-3 border-t border-pb-hairline space-y-1">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <PbAvatar name={user?.name ?? "U"} size={32} tone="court" />
                        <div>
                          <p className="text-[13px] font-medium text-pb-ink">{user?.name}</p>
                          <p className="text-[11px] text-pb-muted capitalize">{user?.role}</p>
                        </div>
                      </div>
                      <Link to="/profile" onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[13px] text-pb-ink2 hover:bg-pb-surface2 rounded-[6px]">
                        <UserCircle className="w-4 h-4 text-pb-muted" /> Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-destructive hover:bg-destructive/8 rounded-[6px]"
                      >
                        <SignOut className="w-4 h-4" /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-[14px] font-medium text-pb-ink2 hover:bg-pb-surface2 rounded-[6px]">
                        <SignIn className="w-4 h-4 text-pb-muted" /> Log in
                      </Link>
                      <Link to="/signup" onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 text-[14px] font-medium bg-pb-ink text-white rounded-[6px]">
                        <User className="w-4 h-4" /> Sign up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="hidden md:block h-14" />
    </>
  );
};

export default Navbar;
