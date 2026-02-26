import { cn } from "@/lib/utils";
import { PlusCircle, Radio, Search, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { href: "/tournaments", label: "Explore", icon: Search },
    { href: "/live", label: "Live", icon: Radio },
    { href: "/create-tournament", label: "Host", icon: PlusCircle },
    { href: "/teams", label: "Partner", icon: Users },
    { href: "/dashboard", label: "Me", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50 px-2 pb-safe">
      <nav className="flex items-center justify-between h-16">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href) && 
            (item.href !== "/tournaments" || location.pathname === "/tournaments" || location.pathname.startsWith("/tournaments/"));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-display font-bold tracking-wide uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNav;
