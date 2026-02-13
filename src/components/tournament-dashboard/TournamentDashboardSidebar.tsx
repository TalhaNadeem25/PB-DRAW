import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Sparkles,
  Clock,
  GitBranch,
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
    <nav className="glass-card rounded-2xl sticky top-28 w-64 hidden lg:block p-3 space-y-1">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-hero-gradient text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        );
      })}

      {/* Divider */}
      <div className="border-t border-border/50 my-3" />

      {/* Bottom links */}
      <Link
        to="/analytics"
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
      >
        <BarChart3 className="w-4 h-4 shrink-0" />
        Analytics
      </Link>
      <Link
        to={`/tournaments/${tournamentId}/edit`}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
      >
        <Settings className="w-4 h-4 shrink-0" />
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
  <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6">
    <div className="flex gap-2 min-w-max">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
              isActive
                ? "bg-hero-gradient text-primary-foreground shadow-glow"
                : "glass text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  </div>
);
