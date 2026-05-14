import { cn } from "@/lib/utils";
import {
  ChartBar, Calendar, ClipboardText, Clock, Flask, GitBranch,
  Stack, SquaresFour, ListNumbers, ArrowsCounterClockwise,
  Gear, Sparkle, Trophy, Users,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Eyebrow } from "@/components/ui/pb";

export type DashboardSection =
  | "dashboard" | "events" | "waitlist" | "pools" | "registrations"
  | "planner" | "ai-planner" | "schedule" | "brackets" | "scores"
  | "refunds" | "test";

interface SidebarItem { id: DashboardSection; label: string; icon: React.ElementType }
interface SidebarCategory { title: string; items: SidebarItem[] }

const sidebarCategories: SidebarCategory[] = [
  {
    title: "1. Setup Phase",
    items: [
      { id: "dashboard",      label: "Overview",         icon: SquaresFour },
      { id: "events",         label: "Events",           icon: Trophy      },
      { id: "waitlist",       label: "Waitlist",         icon: ListNumbers },
      { id: "planner",        label: "Planner",          icon: Calendar    },
    ],
  },
  {
    title: "2. Pre-Tournament",
    items: [
      { id: "registrations",  label: "Players & Check-in", icon: Users    },
      { id: "ai-planner",     label: "AI Planner (Beta)",  icon: Sparkle  },
      { id: "pools",          label: "Pool Setup",         icon: Stack    },
      { id: "schedule",       label: "Court Scheduling",   icon: Clock    },
    ],
  },
  {
    title: "3. Day-Of",
    items: [
      { id: "brackets",       label: "Live Brackets & Play", icon: GitBranch    },
      { id: "scores",         label: "Input Scores",         icon: ClipboardText },
    ],
  },
  {
    title: "4. Post-Tournament",
    items: [
      { id: "refunds",        label: "Refunds",           icon: ArrowsCounterClockwise },
    ],
  },
  {
    title: "Test Panel",
    items: [
      { id: "test",           label: "Test Data",         icon: Flask },
    ],
  },
];

const flatSidebarItems = sidebarCategories.flatMap((c) => c.items);

interface TournamentDashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  tournamentId: string;
}

const TournamentDashboardSidebar = ({
  activeSection,
  onSectionChange,
  tournamentId,
}: TournamentDashboardSidebarProps) => (
  <nav className="hidden lg:block w-56 shrink-0 space-y-5">
    {sidebarCategories.map((category) => (
      <div key={category.title}>
        <div className="px-3 mb-1.5">
          <Eyebrow>{category.title}</Eyebrow>
        </div>
        <div className="space-y-0.5">
          {category.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-sans transition-colors border-l-2",
                  isActive
                    ? "border-pb-court bg-pb-court-tint2 text-pb-court font-medium"
                    : "border-transparent text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
                )}
              >
                <Icon size={14} className="shrink-0" weight={isActive ? "bold" : "regular"} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    ))}

    <div className="border-t border-pb-hairline pt-3 space-y-0.5">
      <Link
        to="/analytics"
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-sans text-pb-muted hover:text-pb-ink hover:bg-pb-surface2 transition-colors border-l-2 border-transparent"
      >
        <ChartBar size={14} className="shrink-0" />
        Analytics
      </Link>
      <Link
        to={`/tournaments/${tournamentId}/edit`}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-sans text-pb-muted hover:text-pb-ink hover:bg-pb-surface2 transition-colors border-l-2 border-transparent"
      >
        <Gear size={14} className="shrink-0" />
        Settings
      </Link>
    </div>
  </nav>
);

export default TournamentDashboardSidebar;

/** Mobile horizontal tab strip */
export const MobileDashboardNav = ({
  activeSection,
  onSectionChange,
}: {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}) => (
  <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-pb-hairline mb-6 bg-pb-surface sticky top-14 z-20">
    <div className="flex gap-1 min-w-max py-2">
      {flatSidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-mono transition-colors whitespace-nowrap",
              isActive
                ? "bg-pb-ink text-white"
                : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2"
            )}
          >
            <Icon size={12} />
            {item.label}
          </button>
        );
      })}
    </div>
  </div>
);
