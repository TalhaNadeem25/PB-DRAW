import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Sparkles,
  Clock,
  GitBranch,
  Layers,
  ClipboardList,
  BarChart3,
  Settings,
  RefreshCcw,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardSection =
  | "dashboard"
  | "events"
  | "pools"
  | "registrations"
  | "planner"
  | "ai-planner"
  | "schedule"
  | "brackets"
  | "scores"
  | "refunds"
  | "test";

interface SidebarItem {
  id: DashboardSection;
  label: string;
  icon: React.ElementType;
}

const sidebarItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "events", label: "Events", icon: Trophy },
  { id: "pools", label: "Pools", icon: Layers },
  { id: "registrations", label: "Registrations", icon: Users },
  { id: "planner", label: "Planner", icon: Calendar },
  { id: "ai-planner", label: "AI Planner", icon: Sparkles },
  { id: "schedule", label: "Schedule", icon: Clock },
  { id: "brackets", label: "Brackets", icon: GitBranch },
  { id: "scores", label: "Scores", icon: ClipboardList },
  { id: "refunds", label: "Refunds", icon: RefreshCcw },
  { id: "test", label: "Test Data", icon: FlaskConical },
];

interface TournamentDashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  tournamentId: string;
}

const TournamentDashboardSidebar = ({
  activeSection,
  onSectionChange,
  tournamentId,
}: TournamentDashboardSidebarProps) => {
  return (
    <nav className="bg-card border-none sm:border-r-2 sm:border-border sm:shadow-none shadow-sm sm:w-64 hidden lg:block p-3 space-y-1">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-all duration-200 border-l-4",
              isActive
                ? "border-primary bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "")} />
            <span className="font-display tracking-widest uppercase">{item.label}</span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="border-t border-border/50 my-3" />

      {/* Bottom links */}
      <Link
        to="/analytics"
        className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold border-l-4 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 uppercase font-display tracking-widest"
      >
        <BarChart3 className="w-5 h-5 shrink-0" />
        Analytics
      </Link>
      <Link
        to={`/tournaments/${tournamentId}/edit`}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold border-l-4 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 uppercase font-display tracking-widest"
      >
        <Settings className="w-5 h-5 shrink-0" />
        Settings
      </Link>
    </nav>
  );
};

export default TournamentDashboardSidebar;

/** Mobile horizontal tab bar — rendered outside the sidebar on <lg screens */
export const MobileDashboardNav = ({
  activeSection,
  onSectionChange,
}: {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}) => (
  <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 border-b-2 border-border/50 mb-6 bg-card sticky top-14 z-20">
    <div className="flex gap-4 min-w-max px-2">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "flex items-center gap-2 px-2 py-4 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-4",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "")} />
            <span className="font-display tracking-widest uppercase">{item.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);
