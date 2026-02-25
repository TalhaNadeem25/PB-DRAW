import { cn } from "@/lib/utils";
import {
    BarChart3,
    Calendar,
    ClipboardList,
    Clock,
    FlaskConical,
    GitBranch,
    Layers,
    LayoutDashboard,
    RefreshCcw,
    Settings,
    Sparkles,
    Trophy,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";

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

interface SidebarCategory {
  title: string;
  items: SidebarItem[];
}

const sidebarCategories: SidebarCategory[] = [
  {
    title: "1. Setup Phase",
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "events", label: "Events", icon: Trophy },
      { id: "planner", label: "Planner", icon: Calendar },
    ],
  },
  {
    title: "2. Pre-Tournament",
    items: [
      { id: "registrations", label: "Players & Check-in", icon: Users },
      { id: "ai-planner", label: "AI Planner (Beta)", icon: Sparkles },
      { id: "pools", label: "Pool Setup", icon: Layers },
      { id: "schedule", label: "Court Scheduling", icon: Clock },
    ],
  },
  {
    title: "3. Day-Of",
    items: [
      { id: "brackets", label: "Live Brackets & Play", icon: GitBranch },
      { id: "scores", label: "Input Scores", icon: ClipboardList },
    ],
  },
  {
    title: "4. Post-Tournament",
    items: [
      { id: "refunds", label: "Refunds", icon: RefreshCcw },
    ],
  },
  {
    title: "Test Panel",
    items: [
      { id: "test", label: "Test Data", icon: FlaskConical },
    ],
  }
];

// Helper to get flat items for mobile nav
const flatSidebarItems = sidebarCategories.flatMap(c => c.items);

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
    <nav className="bg-card border-none sm:border-r-2 sm:border-border sm:shadow-none shadow-sm sm:w-64 hidden lg:block p-3 space-y-4">
      {sidebarCategories.map((category) => (
        <div key={category.title} className="space-y-1">
          <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 font-display">
            {category.title}
          </h4>
          {category.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border-l-4",
                  isActive
                    ? "border-primary bg-primary/10 text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}

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
      {flatSidebarItems.map((item) => {
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
