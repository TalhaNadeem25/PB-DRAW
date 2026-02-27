import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy, User, LogIn, LogOut, UserCircle, Home, LayoutDashboard, Users, Radio, BarChart, Sparkles, Heart, ChevronRight, CreditCard, Settings, Grid3X3, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

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
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/find-partner", label: "Partner", icon: Heart, isNew: true },
    ...(user?.role === 'organizer' || user?.role === 'admin'
      ? [{ href: "/tournament-planner", label: "AI Planner", icon: Sparkles }]
      : []
    ),
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const authenticatedNavLinks = isAuthenticated
    ? [
        { href: "/", label: "Home", icon: Home },
        ...navLinks,
      ]
    : navLinks;

  const isActive = (path: string) => location.pathname === path;

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
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-300">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold text-foreground tracking-wide whitespace-nowrap">
                PICKLE<span className="text-primary"> RALLY</span>
              </span>
            </Link>

            {/* Desktop Nav — icon-only, spread evenly between logo and actions */}
            <div className="hidden lg:flex flex-1 items-center justify-evenly min-w-0 px-4 md:px-6">
              {authenticatedNavLinks.map((link) => {
                const Icon = link.icon;
                const isLiveLink = (link as any).isLive;
                const isNewLink = (link as any).isNew;
                const navLink = (
                  <Link
                    key={link.href}
                    to={link.href}
                    aria-label={link.label}
                    className={cn(
                      "relative flex items-center justify-center gap-1.5 text-sm font-medium transition-all duration-200 p-2.5 rounded-xl min-w-[40px]",
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isLiveLink && (
                      <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                      </span>
                    )}
                    {isNewLink && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" title="New" />
                    )}
                    {isActive(link.href) && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </Link>
                );
                return (
                  <Tooltip key={link.href} delayDuration={200}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="bottom" className="font-medium">
                      {link.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                    {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  {/* Notification Center */}
                  <NotificationCenter />
                  
                  {(user?.role === 'organizer' || user?.role === 'admin') && (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="sm" className="shadow-md hover:shadow-glow transition-shadow gap-1.5 px-3 xl:px-4" asChild>
                          <Link to="/create-tournament">
                            <Trophy className="w-4 h-4 shrink-0" />
                            <span className="hidden xl:inline">Create Tournament</span>
                            <span className="xl:hidden">Create</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Create Tournament</TooltipContent>
                    </Tooltip>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent/50 p-1 pr-3 rounded-xl">
                        <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm">
                          <span className="text-xs font-display font-black text-primary-foreground">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="max-w-[120px] truncate hidden xl:inline text-sm font-medium">{user?.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-[290px] p-0 bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden z-50">

                      {/* ── Hero Header ── */}
                      <div className="relative bg-hero-gradient px-5 pt-5 pb-5 overflow-hidden">
                        {/* decorative circles */}
                        <div className="absolute -right-5 -top-5 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
                        <div className="absolute -right-1 -top-1 w-10 h-10 bg-white/5 rounded-full pointer-events-none" />
                        <div className="absolute left-0 bottom-0 w-16 h-16 bg-black/5 rounded-full blur-xl pointer-events-none" />

                        <div className="relative flex items-center gap-3.5">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
                              <span className="text-xl font-display font-black text-white leading-none">
                                {user?.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white/40 shadow-sm" />
                          </div>

                          {/* Name + badges */}
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-black text-white text-[15px] uppercase tracking-tight leading-none truncate mb-2">
                              {user?.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="px-2 py-0.5 bg-white/15 border border-white/20 rounded-full text-[9px] font-display font-bold text-white/90 uppercase tracking-widest">
                                {user?.role}
                              </span>
                              <span className="px-2 py-0.5 bg-white/15 border border-white/20 rounded-full text-[9px] font-display font-bold text-white/90 uppercase tracking-widest">
                                {user?.skillLevel || '3.5'} NTRP
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Stat Strip ── */}
                      <div className="grid grid-cols-2 divide-x divide-border/40 border-b border-border/40">
                        <div className="px-4 py-3">
                          <p className="text-[8px] font-display font-bold tracking-[0.2em] text-muted-foreground uppercase mb-0.5">Skill</p>
                          <p className="text-[26px] font-display font-black text-foreground leading-none tracking-tighter">
                            {user?.skillLevel || '3.5'}
                          </p>
                          <p className="text-[10px] text-primary font-bold mt-0.5">↗ +0.05 this season</p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[8px] font-display font-bold tracking-[0.2em] text-muted-foreground uppercase mb-0.5">Played</p>
                          <p className="text-[26px] font-display font-black text-foreground leading-none tracking-tighter">12</p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-0.5 flex items-center gap-1">
                            <Trophy className="w-2.5 h-2.5" />
                            {user?.role === 'organizer' ? 'ORGANIZER' : 'PLAYER'}
                          </p>
                        </div>
                      </div>

                      {/* ── Nav Items ── */}
                      <div className="p-1.5 space-y-px">
                        <DropdownMenuItem asChild className="p-0 focus:bg-transparent cursor-pointer group">
                          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-all duration-150">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-display font-black text-foreground uppercase tracking-widest leading-none">Player Hub</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Matches & rankings</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-border group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                          </Link>
                        </DropdownMenuItem>

                        {(user?.role === 'organizer' || user?.role === 'admin') && (
                          <DropdownMenuItem asChild className="p-0 focus:bg-transparent cursor-pointer group">
                            <Link to="/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-all duration-150">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                                <Grid3X3 className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-display font-black text-foreground uppercase tracking-widest leading-none">Organizer HQ</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Manage tournaments</p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-border group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem asChild className="p-0 focus:bg-transparent cursor-pointer group">
                          <Link to="/tickets" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-all duration-150">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                              <CreditCard className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-display font-black text-foreground uppercase tracking-widest leading-none">Payments</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Receipts & history</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-border group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                          </Link>
                        </DropdownMenuItem>
                      </div>

                      {/* ── Footer ── */}
                      <div className="flex items-stretch border-t border-border/40 mx-1.5 mb-1.5">
                        <Link
                          to="/profile"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-display font-black text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all uppercase tracking-[0.15em] rounded-bl-xl rounded-tl-sm"
                        >
                          <Settings className="w-3 h-3" />
                          Settings
                        </Link>
                        <div className="w-px bg-border/40 self-stretch" />
                        <button
                          onClick={handleLogout}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-display font-black text-destructive hover:bg-destructive/10 transition-all uppercase tracking-[0.15em] rounded-br-xl rounded-tr-sm"
                        >
                          <LogOut className="w-3 h-3" />
                          Sign Out
                        </button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                    {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-accent/50" asChild>
                    <Link to="/login">
                      <LogIn className="w-4 h-4 mr-1.5" />
                      Log In
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" className="shadow-md hover:shadow-glow transition-shadow" asChild>
                    <Link to="/signup">
                      <User className="w-4 h-4 mr-1.5" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-accent/50 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
            >
              <div className="relative w-6 h-6">
                <span className={cn(
                  "absolute left-0 block h-0.5 w-6 bg-foreground transition-all duration-300",
                  isOpen ? "top-3 rotate-45" : "top-1"
                )} />
                <span className={cn(
                  "absolute left-0 top-3 block h-0.5 w-6 bg-foreground transition-all duration-300",
                  isOpen ? "opacity-0" : "opacity-100"
                )} />
                <span className={cn(
                  "absolute left-0 block h-0.5 w-6 bg-foreground transition-all duration-300",
                  isOpen ? "top-3 -rotate-45" : "top-5"
                )} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[calc(100vh-5rem)] border-t border-border/50" : "max-h-0"
        )}>
          <div className="px-4 py-4 space-y-2 overflow-y-auto max-h-[calc(100vh-6rem)]">
            {authenticatedNavLinks.map((link) => {
              const Icon = link.icon;
              const isLiveLink = (link as any).isLive;
              const isNewLink = (link as any).isNew;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive(link.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                  {isLiveLink && (
                    <span className="relative flex h-2 w-2 ml-auto">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  {isNewLink && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary to-purple-600 text-white rounded-full ml-auto">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
            
            <div className="pt-3 border-t border-border/50 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="py-3 px-4 bg-accent/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-hero-gradient flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user?.role} • {user?.skillLevel} skill
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="shrink-0">
                        {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Link
                    to="/teams"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    My Teams
                  </Link>
                  {(user?.role === 'organizer' || user?.role === 'admin') && (
                    <Link
                      to="/analytics"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <BarChart className="w-5 h-5" />
                      Analytics
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <UserCircle className="w-5 h-5" />
                    Profile
                  </Link>
                  {(user?.role === 'organizer' || user?.role === 'admin') && (
                    <Button variant="default" size="sm" className="w-full justify-center" asChild>
                      <Link to="/create-tournament" onClick={() => setIsOpen(false)}>
                        <Trophy className="w-4 h-4 mr-2" />
                        Create Tournament
                      </Link>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout} 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-2 px-4">
                    <span className="text-sm font-medium text-muted-foreground">Theme</span>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                      {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Log In
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" className="w-full justify-center" asChild>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <User className="w-4 h-4 mr-2" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Spacer for fixed navbar (responsive to nav height) */}
      <div className="h-16 sm:h-[5rem]" />
    </>
  );
};

export default Navbar;
