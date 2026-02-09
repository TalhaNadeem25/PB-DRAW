import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy, User, LogIn, LogOut, UserCircle, Home, LayoutDashboard, Users, Radio, BarChart, Sparkles, Heart, ChevronRight, CreditCard, Settings, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    { href: "/tournaments", label: "Find Tournaments", icon: Trophy },
    { href: "/find-partner", label: "Find Partner", icon: Heart, isNew: true },
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
          "fixed top-4 left-4 right-4 z-50 transition-all duration-300 rounded-2xl",
          scrolled 
            ? "bg-card/80 backdrop-blur-xl shadow-float border border-border/50" 
            : "bg-card/60 backdrop-blur-lg border border-border/30"
        )}
      >
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-300">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="font-display text-xl font-bold text-foreground tracking-wide">
                PICKLE<span className="text-primary">PLAY</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {authenticatedNavLinks.map((link) => {
                const Icon = link.icon;
                const isLiveLink = (link as any).isLive;
                const isNewLink = (link as any).isNew;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "relative flex items-center gap-2 text-sm font-medium transition-all duration-200 px-4 py-2 rounded-xl",
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                    {isLiveLink && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    {isNewLink && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary to-purple-600 text-white rounded-full">
                        NEW
                      </span>
                    )}
                    {isActive(link.href) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Notification Center */}
                  <NotificationCenter />
                  
                  {(user?.role === 'organizer' || user?.role === 'admin') && (
                    <Button variant="default" size="sm" className="shadow-md hover:shadow-glow transition-shadow" asChild>
                      <Link to="/create-tournament">
                        <Trophy className="w-4 h-4 mr-1.5" />
                        Create Tournament
                      </Link>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent/50">
                        <div className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="max-w-[100px] truncate hidden lg:inline">{user?.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-[320px] p-0 bg-card border border-border/60 shadow-lg rounded-2xl overflow-hidden z-50">
                      {/* User Profile Header */}
                      <div className="p-5 bg-accent/30 border-b border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-hero-gradient flex items-center justify-center shadow-md shrink-0">
                            <span className="text-lg font-bold text-primary-foreground">
                              {user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-display font-bold text-foreground truncate">{user?.name}</p>
                            <p className="text-xs font-display font-semibold text-primary flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                              {user?.role?.toUpperCase()} • {String(user?.skillLevel || '3.5').toUpperCase()} SKILL
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border/40">
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-[10px] font-display font-bold tracking-wider text-muted-foreground uppercase mb-0.5">
                            Skill Level
                          </p>
                          <p className="text-2xl font-display font-bold text-foreground leading-tight">
                            {user?.skillLevel || '3.5'}
                          </p>
                          <p className="text-xs text-primary font-semibold mt-0.5">↗ +0.05</p>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-[10px] font-display font-bold tracking-wider text-muted-foreground uppercase mb-0.5">
                            Tournaments
                          </p>
                          <p className="text-2xl font-display font-bold text-foreground leading-tight">
                            12
                          </p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {user?.role === 'organizer' ? 'ORGANIZER' : 'PLAYER'}
                          </p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2 space-y-0.5">
                        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-accent/50">
                          <Link to="/dashboard" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <LayoutDashboard className="w-4 h-4 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">Player Hub</p>
                              <p className="text-xs text-muted-foreground">Manage your matches & rankings</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </Link>
                        </DropdownMenuItem>

                        {(user?.role === 'organizer' || user?.role === 'admin') && (
                          <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-accent/50">
                            <Link to="/analytics" className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Grid3X3 className="w-4 h-4 text-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">Organizer Dashboard</p>
                                <p className="text-xs text-muted-foreground">Manage hosted tournaments</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-accent/50">
                          <Link to="/my-tickets" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <CreditCard className="w-4 h-4 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">Payment History</p>
                              <p className="text-xs text-muted-foreground">View receipts and dues</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </Link>
                        </DropdownMenuItem>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
                        <Link
                          to="/profile"
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
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
              className="md:hidden p-2 rounded-xl hover:bg-accent/50 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
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
          "md:hidden overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[500px] border-t border-border/50" : "max-h-0"
        )}>
          <div className="px-4 py-4 space-y-2">
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
                      <div>
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user?.role} • {user?.skillLevel} skill
                        </p>
                      </div>
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
      
      {/* Spacer for fixed navbar */}
      <div className="h-24" />
    </>
  );
};

export default Navbar;
