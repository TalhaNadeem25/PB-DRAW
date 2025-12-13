import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy, User, LogIn, LogOut, UserCircle, Search, DollarSign, HelpCircle, Home, LayoutDashboard, Users, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { href: "/live", label: "Live", icon: Radio, isLive: true },
    { href: "/tournaments", label: "Find Tournaments", icon: Search },
    { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
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
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50" />
      
      <nav className="fixed top-1 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                PICKLE<span className="text-primary">PLAY</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {authenticatedNavLinks.map((link) => {
                const Icon = link.icon;
                const isLiveLink = (link as any).isLive;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 rounded-lg relative",
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
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
                  </Link>
                );
              })}
            </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {(user?.role === 'organizer' || user?.role === 'admin') && (
                  <Button variant="default" size="sm" asChild>
                    <Link to="/create-tournament">
                      <Trophy className="w-4 h-4 mr-1" />
                      Create Tournament
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <UserCircle className="w-4 h-4" />
                      <span className="max-w-[120px] truncate">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user?.role} • {user?.skillLevel} skill
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/">
                        <Home className="w-4 h-4 mr-2" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/teams">
                        <Users className="w-4 h-4 mr-2" />
                        My Teams
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <UserCircle className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="w-4 h-4 mr-1" />
                    Log In
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/signup">
                    <User className="w-4 h-4 mr-1" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {authenticatedNavLinks.map((link) => {
              const Icon = link.icon;
              const isLiveLink = (link as any).isLive;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors relative",
                    isActive(link.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {isLiveLink && (
                    <span className="relative flex h-2 w-2 ml-auto">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <div className="py-2 px-3 bg-accent rounded-lg">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {user?.role} • {user?.skillLevel} skill
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link to="/" onClick={() => setIsOpen(false)}>
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link to="/teams" onClick={() => setIsOpen(false)}>
                      <Users className="w-4 h-4 mr-2" />
                      My Teams
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                  {(user?.role === 'organizer' || user?.role === 'admin') && (
                    <Button variant="default" size="sm" asChild>
                      <Link to="/create-tournament" onClick={() => setIsOpen(false)}>
                        <Trophy className="w-4 h-4 mr-2" />
                        Create Tournament
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Log In
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
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
      )}
      
      {/* Bottom accent bar */}
      <div className="fixed top-[65px] left-0 right-0 h-1 bg-primary z-40" />
    </nav>
    </>
  );
};

export default Navbar;
